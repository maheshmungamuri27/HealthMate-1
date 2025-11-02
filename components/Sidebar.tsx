
import React from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslations } from '../hooks/useTranslations';
import type { Page } from '../types';
import Icon from './common/Icon';
import type { TranslationKey } from '../lib/i18n';

interface SidebarProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setOpen }) => {
  const { page, changePage, logout } = useApp();
  const t = useTranslations();

  const navItems: { id: Page; label: TranslationKey; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
    { id: 'dashboard', label: 'home', icon: 'home' },
    { id: 'appointments', label: 'opBooking', icon: 'calendar' },
    { id: 'scan', label: 'scanMedicine', icon: 'scan' },
    { id: 'symptom-checker', label: 'symptomChecker', icon: 'symptom' },
    { id: 'vitals', label: 'vitals', icon: 'vitals' },
    { id: 'reminders', label: 'medicineReminders', icon: 'bell' },
    { id: 'order-medicine', label: 'orderMedicine', icon: 'cart' },
    { id: 'order-history', label: 'orderHistory', icon: 'document' },
    { id: 'settings', label: 'settings', icon: 'settings' },
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setOpen(false)}></div>
      <aside className={`bg-white text-gray-800 w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30 flex flex-col shadow-lg`}>
        <div className="px-4">
           <div className="flex items-center space-x-2">
             <div className="p-2 bg-primary rounded-md text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
               </svg>
             </div>
             <h2 className="text-2xl font-bold">{t('appName')}</h2>
           </div>
        </div>
        
        <nav className="flex-grow">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { changePage(item.id); setOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-left ${
                page === item.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-primary/10 text-gray-600'
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5" />
              <span className="font-medium">{t(item.label)}</span>
            </button>
          ))}
        </nav>
        
        <div>
           <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-600 transition-colors duration-200"
          >
            <Icon name="logout" className="w-5 h-5" />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
