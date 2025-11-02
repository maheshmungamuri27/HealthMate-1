
import { createContext } from 'react';
import type { AppContextType } from '../types';

export const AppContext = createContext<AppContextType>({
  user: null,
  page: 'landing',
  language: 'en',
  login: () => {},
  logout: () => {},
  setPage: () => {},
  changePage: () => {},
  setLanguage: () => {},
  setUser: () => {},
  hospitalSearchQuery: '',
  setHospitalSearchQuery: () => {},
  medicineSearchQuery: '',
  setMedicineSearchQuery: () => {},
  voiceAction: null,
  setVoiceAction: () => {},
  
  // Conversational Form Defaults
  conversationalForm: null,
  startConversationalForm: () => {},
  advanceConversationalForm: () => {},
  cancelConversationalForm: () => {},
});
