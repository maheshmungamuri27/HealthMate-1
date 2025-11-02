
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppContext } from './contexts/AppContext';
import type { Page, User, Language, ConversationalFormState } from './types';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Booking from './components/Booking';
import Scan from './components/Scan';
import Login from './components/Login';
import Settings from './components/Settings';
import Reminders from './components/Reminders';
import OrderMedicine from './components/OrderMedicine';
import OrderHistory from './components/OrderHistory';
import SymptomChecker from './components/SymptomChecker';
import Vitals from './components/Vitals';
import VoiceAssistant from './components/common/VoiceAssistant';
import Landing from './Landing';
import { getCurrentUser, signOut } from './services/mockApiService';

const LANGUAGE_KEY = 'healthmate_language';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('landing');
  const [language, setLanguageState] = useState<Language>('en');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState('');
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [voiceAction, setVoiceAction] = useState<string | null>(null);

  // New Conversational Form State
  const [conversationalForm, setConversationalForm] = useState<ConversationalFormState | null>(null);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem(LANGUAGE_KEY, lang);
    setLanguageState(lang);
  }, []);

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem(LANGUAGE_KEY);
      if (storedLang && ['en', 'te', 'hi'].includes(storedLang)) {
        setLanguageState(storedLang as Language);
      }
      
      const sessionUser = getCurrentUser();
      if (sessionUser) {
        setUser(sessionUser);
        if (page === 'login' || page === 'landing') {
          setPage('dashboard');
        }
      } else {
        setUser(null);
         if (page !== 'landing' && page !== 'login') {
          setPage('landing');
        }
      }
    } catch (error) {
      console.error("Failed to initialize from localStorage", error);
    }
    setIsInitialized(true);
  }, [page]);

  const logout = useCallback(() => {
    signOut();
    setUser(null);
    setPage('landing');
  }, []);
  
  const handleSetUser = useCallback((updatedUser: User | null) => {
    setUser(updatedUser);
  }, []);
  
  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setPage('dashboard');
  }, []);
  
  const changePage = useCallback((newPage: Page) => {
    setPage(newPage);
  }, []);

  const speak = useCallback((text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.lang = langCode;
      window.speechSynthesis.speak(utterance);
  }, [language]);

  const startConversationalForm = useCallback((formId: string, fields: Array<{ id: string; question: string }>, onComplete: (formData: Record<string, any>) => void) => {
    const initialState: ConversationalFormState = {
      formId,
      fields: fields.map(f => ({ ...f, value: null })),
      currentIndex: 0,
      onComplete,
    };
    setConversationalForm(initialState);
    speak(initialState.fields[0].question);
  }, [speak]);

  const advanceConversationalForm = useCallback((value: string) => {
    if (!conversationalForm) return;

    const newFields = [...conversationalForm.fields];
    newFields[conversationalForm.currentIndex].value = value;
    const nextIndex = conversationalForm.currentIndex + 1;

    if (nextIndex < newFields.length) {
        const nextState = { ...conversationalForm, fields: newFields, currentIndex: nextIndex };
        setConversationalForm(nextState);
        speak(nextState.fields[nextIndex].question);
    } else {
        const formData = newFields.reduce((acc, field) => {
            acc[field.id] = field.value;
            return acc;
        }, {} as Record<string, any>);
        conversationalForm.onComplete(formData);
        setConversationalForm(null); // End of form
    }
  }, [conversationalForm, speak]);

  const cancelConversationalForm = useCallback(() => {
      setConversationalForm(null);
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'appointments': return <Booking />;
      case 'scan': return <Scan />;
      case 'symptom-checker': return <SymptomChecker />;
      case 'reminders': return <Reminders />;
      case 'order-medicine': return <OrderMedicine />;
      case 'order-history': return <OrderHistory />;
      case 'settings': return <Settings />;
      case 'vitals': return <Vitals />;
      default: return <Dashboard />;
    }
  };

  const contextValue = useMemo(() => ({
    user,
    page,
    language,
    login: handleLogin,
    logout,
    setPage,
    changePage,
    setLanguage,
    setUser: handleSetUser,
    hospitalSearchQuery,
    setHospitalSearchQuery,
    medicineSearchQuery,
    setMedicineSearchQuery,
    voiceAction,
    setVoiceAction,
    conversationalForm,
    startConversationalForm,
    advanceConversationalForm,
    cancelConversationalForm,
  }), [user, page, language, logout, handleSetUser, handleLogin, hospitalSearchQuery, medicineSearchQuery, changePage, setLanguage, voiceAction, conversationalForm, startConversationalForm, advanceConversationalForm, cancelConversationalForm]);

  if (!isInitialized) {
    return <div className="flex h-screen w-screen items-center justify-center bg-light">Loading...</div>;
  }
  
  if (!user) {
     return (
        <AppContext.Provider value={contextValue}>
            {page === 'login' ? <Login /> : <Landing />}
        </AppContext.Provider>
     )
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="flex h-screen bg-light font-sans text-dark">
        <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light p-4 md:p-8">
            {renderPage()}
          </main>
        </div>
        <VoiceAssistant />
      </div>
    </AppContext.Provider>
  );
};

export default App;
