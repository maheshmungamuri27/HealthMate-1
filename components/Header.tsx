
import React from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslations } from '../hooks/useTranslations';
import type { Language } from '../types';
import Icon from './common/Icon';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, language, setLanguage } = useApp();
  const t = useTranslations();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  ];

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="text-gray-600 md:hidden mr-4">
            <Icon name="menu" />
        </button>
        <h1 className="text-xl font-semibold text-dark">{t('appName')}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative group">
          <button className="flex items-center space-x-1 text-gray-700">
            <span>{languages.find(l => l.code === language)?.flag}</span>
            <span>{languages.find(l => l.code === language)?.name}</span>
          </button>
          <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-primary">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline text-gray-800 font-medium">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
