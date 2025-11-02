
import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { analyzeSymptoms } from '../services/geminiService';
import { useApp } from '../hooks/useApp';
import Card from './common/Card';
import Icon from './common/Icon';

const SymptomChecker: React.FC = () => {
    const t = useTranslations();
    const { language } = useApp();
    const [symptoms, setSymptoms] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const analysisCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if ((analysis || error) && analysisCardRef.current) {
            analysisCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [analysis, error]);

    const handleAnalyze = async () => {
        if (!symptoms.trim()) return;
        setIsLoading(true);
        setError('');
        setAnalysis('');
        try {
            const result = await analyzeSymptoms(symptoms, language);
            setAnalysis(result);
        } catch (err: any) {
            setError(err.message || 'An error occurred while analyzing symptoms.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartOver = () => {
        setSymptoms('');
        setAnalysis('');
        setError('');
    };

    const renderMarkdown = (text: string) => {
        if (!text) return '';
        // A simple markdown renderer for bold text and newlines.
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
                <Icon name="symptom" className="w-16 h-16 mx-auto text-primary mb-2" />
                <h1 className="text-3xl font-bold text-dark">{t('symptomChecker')}</h1>
            </header>

            {!analysis && !isLoading ? (
                <Card>
                    <div className="space-y-4">
                        <label htmlFor="symptoms-input" className="block font-semibold text-gray-700">
                            {t('describeSymptomsPrompt')}
                        </label>
                        <textarea
                            id="symptoms-input"
                            rows={5}
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder={t('describeSymptomsPrompt')}
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={!symptoms.trim()}
                            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {t('getAnalysis')}
                        </button>
                    </div>
                </Card>
            ) : null}

            {isLoading && (
                <Card className="flex flex-col items-center justify-center p-8">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                        <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                    <p className="mt-4 text-gray-600">{t('processing')}</p>
                </Card>
            )}

            {(analysis || error) && !isLoading && (
                <div ref={analysisCardRef}>
                    <Card>
                        <h2 className="text-2xl font-bold text-dark mb-4">{t('symptomAnalysis')}</h2>
                        {error && <p className="text-red-500">{error}</p>}
                        {analysis && <div className="prose max-w-none prose-strong:text-dark" dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }}></div>}
                        
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
                            <p dangerouslySetInnerHTML={{ __html: renderMarkdown(t('aiDisclaimer')) }}></p>
                        </div>

                        <button
                            onClick={handleStartOver}
                            className="mt-6 w-full bg-secondary text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            {t('startOver')}
                        </button>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SymptomChecker;
