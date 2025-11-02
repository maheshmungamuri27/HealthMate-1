
export type Page = 'landing' | 'login' | 'dashboard' | 'appointments' | 'scan' | 'reminders' | 'order-medicine' | 'order-history' | 'settings' | 'symptom-checker' | 'vitals';

export type Language = 'en' | 'te' | 'hi';

export interface User {
  uid: string;
  name: string;
  email?: string | null;
}

export interface ConversationalFormState {
  formId: string;
  fields: Array<{ id: string; question: string; value: string | null }>;
  currentIndex: number;
  onComplete: (formData: Record<string, any>) => void;
}

export interface AppContextType {
  user: User | null;
  page: Page;
  language: Language;
  login: (user: User) => void;
  logout: () => void;
  setPage: (page: Page) => void;
  changePage: (page: Page) => void;
  setLanguage: (language: Language) => void;
  setUser: (user: User | null) => void;
  hospitalSearchQuery: string;
  setHospitalSearchQuery: (query: string) => void;
  medicineSearchQuery: string;
  setMedicineSearchQuery: (query: string) => void;
  voiceAction: string | null;
  setVoiceAction: (action: string | null) => void;
  
  // New Conversational Form State
  conversationalForm: ConversationalFormState | null;
  startConversationalForm: (formId: string, fields: Array<{ id: string; question: string }>, onComplete: (formData: Record<string, any>) => void) => void;
  advanceConversationalForm: (value: string) => void;
  cancelConversationalForm: () => void;
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  district: string;
  logo: string;
  specializations: string[];
}

export interface AppointmentDetails {
  hospital: Hospital;
  date: Date;
  time: string;
  patientName: string;
  patientAge: string;
  phone: string;
  appointmentType: 'normal' | 'emergency';
}

export interface Reminder {
  id: string;
  patientName: string;
  medicineName: string;
  dosage: string;
  time: string; // "HH:MM" format
  date: string; // "YYYY-MM-DD" format
  status: 'pending' | 'taken' | 'missed';
  takenAt: string | null; // ISO string
  alerted?: boolean;
}

export type MedicineCategory = 'tablet' | 'syrup' | 'pain-relief' | 'general';

export interface Medicine {
    id: number;
    name: string;
    price: number;
    icon: 'tablet' | 'syrup' | 'pill';
    category: MedicineCategory;
}


export interface CartItem extends Medicine {
    quantity: number;
}

export interface Order {
    id: string;
    date: string; // ISO String
    hospitalName: string;
    items: CartItem[];
    total: number;
    deliveryAddress: string;
    deliveryDate: string;
    deliveryTime: string;
}

export type VitalType = 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'weight';

export interface VitalReadingValue {
    systolic?: number;
    diastolic?: number;
    reading?: number;
}

export interface Vital {
    id: string;
    userId: string;
    type: VitalType;
    date: string; // ISO String
    value: VitalReadingValue;
    unit: string;
}
