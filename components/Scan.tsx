import React, { useState, useRef, useEffect } from 'react';
import Card from './common/Card';
import Icon from './common/Icon';
import { useTranslations } from '../../hooks/useTranslations';
import { fileToBase64 } from '../lib/utils';
import { analyzeMedicineImage, summarizeMedicalReport } from '../services/geminiService';

type ScanMode = 'medicine' | 'report';

const Scan: React.FC = () => {
  const t = useTranslations();
  const [activeMode, setActiveMode] = useState<ScanMode | null>(null);
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [resultTitle, setResultTitle] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((result || error) && resultCardRef.current) {
      resultCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result, error]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeMode) return;

    setIsLoading(true);
    setError('');
    setResult('');
    setResultTitle(activeMode === 'medicine' ? 'Medicine Analysis' : t('summarizeReport'));

    try {
      const base64Image = await fileToBase64(file);
      let apiResult = '';
      if (activeMode === 'medicine') {
        apiResult = await analyzeMedicineImage(base64Image, file.type);
      } else {
        apiResult = await summarizeMedicalReport(base64Image, file.type);
      }
      setResult(apiResult);
    } catch (err) {
      console.error(err);
      setError('Failed to process the file. Please try again.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = (selectedMode: ScanMode) => {
    setActiveMode(selectedMode);
    fileInputRef.current?.click();
  };

  const renderMarkdown = (text: string) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-dark">{t('scanOrSummarize')}</h1>
      </header>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center text-center space-y-4">
          <Icon name="camera" className="w-12 h-12 text-primary" />
          <h2 className="text-xl font-bold">{t('scanMedicine')}</h2>
          <button onClick={() => handleUploadClick('medicine')} className="w-full flex items-center justify-center space-x-2 bg-secondary text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors">
            <Icon name="upload" className="w-5 h-5"/>
            <span>{t('uploadPhoto')}</span>
          </button>
        </Card>

        <Card className="flex flex-col items-center text-center space-y-4">
          <Icon name="document" className="w-12 h-12 text-primary" />
          <h2 className="text-xl font-bold">{t('summarizeReport')}</h2>
          <button onClick={() => handleUploadClick('report')} className="w-full flex items-center justify-center space-x-2 bg-secondary text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors">
            <Icon name="upload" className="w-5 h-5"/>
            <span>{t('uploadDoc')}</span>
          </button>
        </Card>
      </div>

      {(isLoading || result || error) && (
        <div ref={resultCardRef}>
            <Card>
            <h3 className="font-bold text-lg mb-4">{resultTitle || t('generatedSummary')}</h3>
            {isLoading && (
                <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:0.4s]"></div>
                <p>Analyzing...</p>
                </div>
            )}
            {error && <p className="text-red-500">{error}</p>}
            {result && <div className="prose max-w-none prose-strong:text-dark" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}></div>}
            </Card>
        </div>
      )}
    </div>
  );
};

export default Scan;
