import React from 'react';
import { useApp } from './hooks/useApp';
import { useTranslations } from './hooks/useTranslations';
import type { Language } from './types';
import Icon from './components/common/Icon';

const Landing: React.FC = () => {
  const { setPage, language, setLanguage } = useApp();
  const t = useTranslations();

  const features = [
    { icon: 'hospital', title: t('featureBookingTitle'), description: t('featureBookingDesc') },
    { icon: 'microscope', title: t('featureAnalysisTitle'), description: t('featureAnalysisDesc') },
    { icon: 'clipboard', title: t('featureReportTitle'), description: t('featureReportDesc') },
    { icon: 'pill', title: t('featureOrderingTitle'), description: t('featureOrderingDesc') },
    { icon: 'alarm', title: t('featureRemindersTitle'), description: t('featureRemindersDesc') },
    { icon: 'mic', title: t('featureVoiceTitle'), description: t('featureVoiceDesc') },
  ];

  const stats = [
    { value: "700+", label: t('statsHospitals') },
    { value: "3", label: t('statsLanguages') },
    { value: "AI-Powered", label: t('statsAI') },
    { value: "24/7", label: t('statsAvailable') },
  ];
  
  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  ];

  return (
    <div className="bg-light text-dark font-sans">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-20 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary rounded-md text-white">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
               </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary">{t('appName')}</h1>
          </div>
          <div className="flex items-center space-x-4">
             <div className="relative group hidden md:block">
                <button className="flex items-center space-x-1 text-gray-700">
                    <span>{languages.find(l => l.code === language)?.flag}</span>
                    <span>{languages.find(l => l.code === language)?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    {languages.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                        <span className="mr-2">{lang.flag}</span>
                        {lang.name}
                    </button>
                    ))}
                </div>
            </div>
            <button onClick={() => setPage('login')} className="bg-gradient-primary text-white font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity">
              {t('getStarted')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          <span className="block">{t('landingTitle')}</span>
          <span className="block bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">{t('landingSubtitle')}</span>
        </h2>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
          {t('landingDescription')}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
                onClick={() => setPage('login')}
                className="bg-gradient-primary text-white font-bold text-lg px-8 py-4 rounded-lg shadow-glow animate-pulse-glow hover:opacity-90 transition-opacity"
            >
                {t('startJourney')}
            </button>
            <button className="font-semibold text-primary hover:underline">
                {t('learnMore')} &rarr;
            </button>
        </div>
      </main>

      {/* Stats Section */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="p-4">
                <p className="text-4xl font-extrabold text-primary">{stat.value}</p>
                <p className="text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold">{t('featuresTitle')}</h3>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">{t('featuresDescription')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-primary/10 text-primary p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Icon name={feature.icon as any} className="w-8 h-8"/>
              </div>
              <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5">
         <div className="container mx-auto px-4 py-20 text-center">
            <h3 className="text-3xl md:text-4xl font-bold">{t('ctaTitle')}</h3>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">{t('ctaDescription')}</p>
            <button
              onClick={() => setPage('login')}
              className="mt-8 bg-gradient-primary text-white font-bold text-lg px-12 py-5 rounded-lg shadow-glow hover:opacity-90 transition-opacity"
            >
              {t('getStartedFree')}
            </button>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white">
        <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2">
                    <h4 className="text-2xl font-bold mb-2">{t('appName')}</h4>
                    <p className="text-slate-300 max-w-xs">{t('footerDescription')}</p>
                </div>
                <div>
                    <h5 className="font-bold mb-4">{t('footerFeatures')}</h5>
                    <ul className="space-y-2 text-slate-300">
                        <li>{t('opBooking')}</li>
                        <li>{t('featureAnalysisTitle')}</li>
                        <li>{t('featureReportTitle')}</li>
                        <li>{t('featureVoiceTitle')}</li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold mb-4">{t('footerSupport')}</h5>
                    <ul className="space-y-2 text-slate-300">
                        <li>{t('footerHelp')}</li>
                        <li>{t('footerContact')}</li>
                        <li>{t('footerPrivacy')}</li>
                        <li>{t('footerTerms')}</li>
                    </ul>
                </div>
                 <div>
                    <h5 className="font-bold mb-4">{t('footerLanguages')}</h5>
                    <ul className="space-y-2 text-slate-300">
                        <li>English</li>
                        <li>తెలుగు (Telugu)</li>
                        <li>हिन्दी (Hindi)</li>
                    </ul>
                </div>
            </div>
            <div className="mt-10 border-t border-slate-700 pt-6 text-center text-sm text-slate-400">
                {t('footerRights')}
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
