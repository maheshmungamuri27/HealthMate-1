import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslations } from '../hooks/useTranslations';
import type { Language } from '../types';
import Card from './common/Card';
import { signInOrSignUpWithName, signInByVoiceName, createVoiceUser } from '../services/mockApiService';
import Icon from './common/Icon';

const LANGUAGE_KEY = 'healthmate_language';

type View = 'language' | 'auth_choice' | 'name_password' | 'voice_login';

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

const LanguageSelector: React.FC<{ onSelect: (lang: Language) => void }> = ({ onSelect }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-3xl font-bold text-dark mb-2">Choose Your Language</h1>
            <p className="text-gray-600 mb-8">మీ భాషను ఎంచుకోండి / अपनी भाषा चुनें</p>
            <div className="space-y-4 w-full max-w-xs">
                <button onClick={() => onSelect('en')} className="w-full bg-white text-lg font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">English</button>
                <button onClick={() => onSelect('te')} className="w-full bg-white text-lg font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">తెలుగు (Telugu)</button>
                <button onClick={() => onSelect('hi')} className="w-full bg-white text-lg font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">हिन्दी (Hindi)</button>
            </div>
        </div>
    );
};

const AuthChoice: React.FC<{ setView: (view: View) => void }> = ({ setView }) => {
    const t = useTranslations();
    
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-dark">{t('appName')}</h1>
                <p className="text-gray-600 mt-2">{t('authChoiceTitle')}</p>
            </div>
            <div className="w-full max-w-sm space-y-4">
                <button 
                    onClick={() => setView('voice_login')} 
                    className="w-full text-left bg-white p-6 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center space-x-4"
                >
                    <Icon name="mic" className="w-10 h-10 text-primary flex-shrink-0" />
                    <div>
                        <h2 className="font-bold text-lg text-dark">{t('signInWithVoice')}</h2>
                        <p className="text-sm text-gray-500">{t('signInWithVoiceDesc')}</p>
                    </div>
                </button>
                <button onClick={() => setView('name_password')} className="w-full text-left bg-white p-6 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center space-x-4">
                    <Icon name="user" className="w-10 h-10 text-primary flex-shrink-0" />
                    <div>
                        <h2 className="font-bold text-lg text-dark">{t('signInWithNamePassword')}</h2>
                        <p className="text-sm text-gray-500">{t('signInWithNamePasswordDesc')}</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

const SimpleLoginForm: React.FC = () => {
    const t = useTranslations();
    const { login } = useApp();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        if (password.length < 8) {
            setError(t('passwordTooShort'));
            setIsLoading(false);
            return;
        }
        try {
            const user = await signInOrSignUpWithName(name, password);
            login(user);
        } catch (err: any) {
            console.error("Login/Signup error:", err);
            setError(err.message || 'Failed to sign in or create account.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-dark">{t('appName')}</h1>
                    <p className="text-gray-600">{t('loginTitle')}</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4" noValidate>
                    {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('name')} className="w-full p-3 border rounded-lg border-gray-300 focus:ring-2 focus:ring-primary outline-none" required />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('password')} className="w-full p-3 border rounded-lg border-gray-300 focus:ring-2 focus:ring-primary outline-none" required />
                    <button type="submit" disabled={isLoading || !name || !password} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isLoading ? t('processing') : t('loginTitle')}
                    </button>
                </form>
            </Card>
        </div>
    );
};

const VoiceLogin: React.FC<{ setView: (view: View) => void }> = ({ setView }) => {
    const t = useTranslations();
    const { login, language } = useApp();
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'error' | 'success'>('idle');
    const [error, setError] = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [promptToCreate, setPromptToCreate] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const statusRef = useRef(status);
    statusRef.current = status;

    const langMap: Record<Language, string> = { en: 'en-US', te: 'te-IN', hi: 'hi-IN' };

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setStatus('error');
            setError('Voice recognition is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = langMap[language];
        recognition.interimResults = false;

        recognition.onstart = () => {
            setStatus('listening');
            setFinalTranscript('');
            setError('');
        };

        recognition.onresult = (event) => {
             const transcript = event.results[0][0].transcript;
             if(transcript) {
                setFinalTranscript(transcript);
             }
        };

        recognition.onend = () => {
             if (statusRef.current === 'listening') {
                setStatus('idle');
             }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setStatus('error');
            if (event.error === 'no-speech') {
                setError(t('voiceLoginErrorNoSpeech'));
            } else if (event.error === 'network') {
                setError(t('voiceErrorNetwork'));
            } else {
                setError(t('voiceLoginErrorMic'));
            }
        };

        recognitionRef.current = recognition;
        return () => { recognition.stop(); };
    }, [language, t]);
    
    useEffect(() => {
        if (finalTranscript && status === 'idle' && !promptToCreate) {
            const handleLogin = async () => {
                setStatus('processing');
                try {
                    const user = await signInByVoiceName(finalTranscript);
                    setStatus('success');
                    setTimeout(() => login(user), 1000);
                } catch (err: any) {
                    if (err.message?.includes("User not found")) {
                        setStatus('idle');
                        setPromptToCreate(finalTranscript);
                    } else {
                        setStatus('error');
                        setError(err.message || 'An unknown error occurred.');
                        setFinalTranscript('');
                    }
                }
            };
            handleLogin();
        }
    }, [status, finalTranscript, login, promptToCreate]);

    const handleListen = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setFinalTranscript('');
            setPromptToCreate(null);
            setError('');
            setStatus('idle');
            recognitionRef.current?.start();
        } catch (err) {
            setStatus('error');
            setError(t('voiceLoginErrorMic'));
        }
    };
    
    const handleCreateAccount = async () => {
        if (!promptToCreate) return;
        setStatus('processing');
        setError('');
        try {
            const user = await createVoiceUser(promptToCreate);
            setFinalTranscript(promptToCreate);
            setStatus('success');
            setTimeout(() => login(user), 1000);
        } catch (err: any) {
            setStatus('error');
            setError(err.message);
        } finally {
            setPromptToCreate(null);
        }
    };
    
    const getStatusMessage = () => {
        switch(status) {
            case 'listening': return t('listening');
            case 'processing': return t('processing');
            case 'success': return `Welcome, ${finalTranscript}!`;
            case 'error': return error;
            default: return t('voiceLoginPrompt');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-sm text-center">
                 <button onClick={() => setView('auth_choice')} className="text-sm text-primary mb-2 absolute top-4 left-4">&larr; Back</button>
                 {promptToCreate ? (
                     <>
                        <h1 className="text-2xl font-bold text-dark mb-4">{t('loginTitle')}</h1>
                        <p className="text-gray-500 mb-8 min-h-[40px]">{t('voiceLoginPromptCreateAccount').replace('{name}', `"${promptToCreate}"`)}</p>
                        <div className="flex flex-col gap-4">
                            <button onClick={handleCreateAccount} disabled={status === 'processing'} className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400">
                                {status === 'processing' ? t('processing') : t('createAccount')}
                            </button>
                            <button onClick={() => { setPromptToCreate(null); setFinalTranscript(''); setStatus('idle'); setError(''); }} className="text-sm text-gray-500 hover:underline">
                                {t('tryDifferentName')}
                            </button>
                        </div>
                     </>
                 ) : (
                    <>
                        <h1 className="text-2xl font-bold text-dark mb-4">{t('voiceLoginTitle')}</h1>
                        <p className="text-gray-500 mb-8 min-h-[40px]">{getStatusMessage()}</p>
                        <button
                            onClick={handleListen}
                            disabled={status === 'listening' || status === 'processing'}
                            className={`w-24 h-24 mx-auto rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-300 disabled:cursor-not-allowed
                                ${status === 'listening' ? 'bg-red-500 animate-pulse' : ''}
                                ${status === 'processing' ? 'bg-gray-400' : ''}
                                ${status === 'idle' || status === 'error' ? 'bg-primary hover:bg-primary-dark' : ''}
                                ${status === 'success' ? 'bg-green-500' : ''}`}
                        >
                            {status === 'success' ? (
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            ) : status === 'processing' ? (
                                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-white"></div>
                            ) : (
                                <Icon name="mic" className="w-12 h-12" />
                            )}
                        </button>
                    </>
                 )}
            </Card>
        </div>
    );
};

const Login: React.FC = () => {
    const { setLanguage } = useApp();
    const [view, setView] = useState<View>('language');
    
    useEffect(() => {
        try {
            const lang = localStorage.getItem(LANGUAGE_KEY);
            if (lang) {
                setView('auth_choice');
            }
        } catch (error) {
            console.error("Could not access localStorage:", error);
            setView('language');
        }
    }, []);

    const handleLanguageSelect = (lang: Language) => {
        setLanguage(lang);
        setView('auth_choice');
    };
    
    const renderContent = () => {
        switch(view) {
            case 'language': return <LanguageSelector onSelect={handleLanguageSelect} />;
            case 'auth_choice': return <AuthChoice setView={setView} />;
            case 'name_password': return <SimpleLoginForm />;
            case 'voice_login': return <VoiceLogin setView={setView} />;
            default: return <AuthChoice setView={setView} />;
        }
    };
    
    return (
      <div className="bg-light min-h-screen text-dark">
          {renderContent()}
      </div>
    );
};

export default Login;