import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { useApp } from '../hooks/useApp';
import { useTranslations } from '../hooks/useTranslations';
import { processVoiceCommand } from '../../services/geminiService';
import type { Page, Language } from '../../types';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onstart: () => void;
  onresult: (event: any) => void;
  onend: () => void;
  onerror: (event: any) => void;
  stop: () => void;
  start: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const VoiceAssistant: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const { 
        page, 
        changePage, 
        setHospitalSearchQuery, 
        setMedicineSearchQuery, 
        language, 
        logout, 
        setVoiceAction,
        conversationalForm,
        startConversationalForm,
        advanceConversationalForm,
    } = useApp();
    const t = useTranslations();

    const langMap: Record<Language, string> = {
        en: 'en-US',
        te: 'te-IN',
        hi: 'hi-IN'
    };
    const currentLangCode = langMap[language] || 'en-US';

    useEffect(() => {
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permission) => {
                setPermissionStatus(permission.state);
                permission.onchange = () => { setPermissionStatus(permission.state); };
            });
        } else {
            setPermissionStatus('prompt');
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setStatusMessage("Voice recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = currentLangCode;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            setStatusMessage(t('listening'));
            setTranscript('');
        };

        recognition.onresult = (event) => {
            const currentTranscript = Array.from(event.results).map(result => result[0]).map(result => result.transcript).join('');
            setTranscript(currentTranscript);
        };

        recognition.onend = () => {
            setIsListening(false);
            if(statusMessage === t('listening')){ setStatusMessage(''); }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                setPermissionStatus('denied');
                setStatusMessage("Microphone is blocked. Please enable it in your browser settings.");
            } else if (event.error === 'network') {
                setStatusMessage(t('voiceErrorNetwork'));
            } else {
                setStatusMessage(`Error: ${event.error}`);
            }
            setIsListening(false);
        }

        recognitionRef.current = recognition;
        return () => { recognition.stop(); };
    }, [t, statusMessage, currentLangCode]);

    const handleToggleListening = async () => {
        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        if (permissionStatus === 'granted') {
            recognitionRef.current?.start();
        } else if (permissionStatus === 'prompt') {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                setPermissionStatus('granted');
                recognitionRef.current?.start();
            } catch (err) {
                console.error("Microphone permission denied.", err);
                setPermissionStatus('denied');
                setStatusMessage("Microphone access was denied.");
            }
        } else if (permissionStatus === 'denied') {
            setStatusMessage("Microphone is blocked. Please enable it in your browser settings to use voice commands.");
        }
    };
    
    useEffect(() => {
        if (!isListening && transcript) {
             // ALL transcripts are processed by Gemini for intent detection.
            const process = async () => {
                setStatusMessage(t('processing'));
                const result = await processVoiceCommand(transcript, conversationalForm?.formId || null, language, page);
                
                // If the intent is a form response, we don't speak Gemini's confirmation text.
                // Instead, the App component will speak the next question after the form state advances.
                if(result.intent === 'form_response') {
                     handleCommandResult(result);
                } else {
                    const utterance = new SpeechSynthesisUtterance(result.response);
                    utterance.lang = currentLangCode;
                    window.speechSynthesis.speak(utterance);
                    
                     utterance.onend = () => {
                        handleCommandResult(result);
                     };
                     utterance.onerror = () => { 
                         setTranscript(''); 
                         setStatusMessage(''); 
                    }
                }
            };
            process();
        }
    }, [isListening, transcript]);

    const handleCommandResult = (result: any) => {
        if (result.intent === 'navigate' && result.payload?.page) {
            changePage(result.payload.page as Page);
        } else if (result.intent === 'search_hospitals' && result.payload?.query) {
            setHospitalSearchQuery(result.payload.query);
            changePage('appointments');
        } else if (result.intent === 'search_medicines' && result.payload?.query) {
            setMedicineSearchQuery(result.payload.query);
            changePage('order-medicine');
        } else if (result.intent === 'form_response' && result.payload?.value) {
            advanceConversationalForm(result.payload.value);
        } else if (result.intent === 'logout') {
            logout();
        } else if (result.intent === 'action' && result.payload?.action) {
            setVoiceAction(result.payload.action);
        } else if (result.intent === 'start_conversation' && result.payload?.formId) {
            // This is handled by components listening to voiceAction now
            setVoiceAction(`initiate_${result.payload.formId}`);
        }
        setTranscript('');
        setStatusMessage('');
    }

    const getCurrentQuestion = () => {
        if (conversationalForm) {
            return conversationalForm.fields[conversationalForm.currentIndex].question;
        }
        return t('tellMeCommand');
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <button
                onClick={handleToggleListening}
                className={`w-16 h-16 rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-primary hover:bg-primary-dark'} ${permissionStatus === 'denied' ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                aria-label="Toggle voice assistant"
                disabled={permissionStatus === 'checking'}
            >
                {permissionStatus === 'denied' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    </svg>
                ): ( <Icon name="mic" className="w-8 h-8" /> )}
            </button>
            {(isListening || statusMessage) && (
                 <div className="absolute bottom-20 right-0 w-72 bg-white p-4 rounded-lg shadow-2xl">
                    <p className="text-gray-700 font-semibold">{statusMessage || t('listening')}</p>
                    <p className="text-sm text-gray-500 min-h-[40px]">{transcript || (permissionStatus !== 'denied' && getCurrentQuestion())}</p>
                 </div>
            )}
        </div>
    );
};

export default VoiceAssistant;