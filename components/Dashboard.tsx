
import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslations } from '../hooks/useTranslations';
import Icon from './common/Icon';
import type { Page } from '../types';
import { getDailyHealthTip } from '../services/geminiService';
import type { TranslationKey } from '../lib/i18n';

const DailyHealthTipCard: React.FC = () => {
    const t = useTranslations();
    const { language } = useApp();
    const [tip, setTip] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTip = async () => {
            setIsLoading(true);
            const languageName = language === 'en' ? 'English' : language === 'te' ? 'Telugu' : 'Hindi';
            const newTip = await getDailyHealthTip(languageName);
            setTip(newTip);
            setIsLoading(false);
        }
        fetchTip();
    }, [language]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="font-bold text-lg text-dark mb-2">{t('dailyHealthTip')}</h2>
            {isLoading ? (
                 <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            ) : (
                <p className="text-gray-600">{tip}</p>
            )}
        </div>
    );
};


const Dashboard: React.FC = () => {
  const { user, changePage } = useApp();
  const t = useTranslations();

  const features: { id: Page; label: TranslationKey; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
    { id: 'appointments', label: 'opBooking', icon: 'calendar' },
    { id: 'scan', label: 'scanMedicine', icon: 'scan' },
    { id: 'symptom-checker', label: 'symptomChecker', icon: 'symptom' },
    { id: 'vitals', label: 'vitalsTracker', icon: 'vitals' },
    { id: 'reminders', label: 'medicineReminders', icon: 'bell' },
    { id: 'order-medicine', label: 'orderMedicine', icon: 'cart' },
  ];

  return (
    <div className="space-y-8">
      <div className="relative bg-gradient-to-r from-primary to-secondary text-white p-8 rounded-xl shadow-lg overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">{t('welcome')}, {user?.name}!</h1>
          <p className="opacity-90">Here's your health dashboard for today.</p>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 200C155.228 200 200 155.228 200 100C200 44.7715 155.228 0 100 0C44.7715 0 0 44.7715 0 100C0 155.228 44.7715 200 100 200Z" fill="white" fillOpacity="0.5"/>
                <path d="M128.5 55.5L92.5 125.5L68.5 98.5" stroke="#00C4B4" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
      </div>

      <DailyHealthTipCard />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {features.map(feature => (
          <button
            key={feature.label}
            onClick={() => changePage(feature.id)}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            aria-label={`Go to ${t(feature.label)}`}
          >
            <div className="bg-primary/10 text-primary p-4 rounded-full">
              <Icon name={feature.icon} className="w-8 h-8" />
            </div>
            <span className="font-semibold text-dark text-lg">{t(feature.label)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
