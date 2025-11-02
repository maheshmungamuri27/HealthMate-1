import type { Reminder, Order, CartItem, User, Vital } from '../types';

// --- STORAGE KEYS ---
const USERS_KEY = 'healthmate_users';
const SESSION_KEY = 'healthmate_session';
const REMINDERS_KEY_PREFIX = 'healthmate_reminders_';
const ORDERS_KEY_PREFIX = 'healthmate_orders_';
const VITALS_KEY_PREFIX = 'healthmate_vitals_';

// --- HELPER FUNCTIONS ---

const getUsers = (): Record<string, any> => {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    } catch {
        return {};
    }
};

const saveUsers = (users: Record<string, any>) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const generateId = () => Math.random().toString(36).substring(2, 10);

// --- AUTH FUNCTIONS ---

export const signInOrSignUpWithName = async (name: string, password: string): Promise<User> => {
    const users = getUsers();
    const normalizedName = name.toLowerCase().trim();
    
    let userRecord = Object.values(users).find((u: any) => u.name.toLowerCase() === normalizedName);

    if (userRecord) {
        if (userRecord.password !== password) {
            throw new Error("Invalid password. Please try again.");
        }
    } else {
        const uid = generateId();
        userRecord = {
            uid,
            name,
            password,
            email: `${normalizedName.replace(/\s+/g, '.')}@example.com`,
            createdAt: new Date().toISOString(),
        };
        users[uid] = userRecord;
        saveUsers(users);
    }
    
    const user: User = { uid: userRecord.uid, name: userRecord.name, email: userRecord.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
};

export const signInByVoiceName = async (name: string): Promise<User> => {
    const users = getUsers();
    const normalizedName = name.toLowerCase().trim().replace(/\.$/, ''); // Also remove trailing period from speech recognition

    // Find the user by name, case-insensitively
    const userRecord = Object.values(users).find(
        (u: any) => u.name.toLowerCase() === normalizedName
    );

    if (userRecord) {
        const user: User = { uid: userRecord.uid, name: userRecord.name, email: userRecord.email };
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
    } else {
        throw new Error("User not found. Please sign in with name and password first to use this feature.");
    }
};

export const createVoiceUser = async (name: string): Promise<User> => {
    const users = getUsers();
    const normalizedName = name.toLowerCase().trim().replace(/\.$/, '');

    const existingUser = Object.values(users).find((u: any) => u.name.toLowerCase() === normalizedName);
    if (existingUser) {
        throw new Error("An account with this name already exists. Please try a different name.");
    }
    
    const uid = generateId();
    const newUserRecord = {
        uid,
        name,
        // No password for voice-only users
        email: `${normalizedName.replace(/\s+/g, '.')}@voice.example.com`,
        createdAt: new Date().toISOString(),
        voiceOnly: true,
    };
    users[uid] = newUserRecord;
    saveUsers(users);
    
    const user: User = { uid: newUserRecord.uid, name: newUserRecord.name, email: newUserRecord.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
};


export const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
    try {
        const userJson = localStorage.getItem(SESSION_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch {
        return null;
    }
};

// --- REMINDER FUNCTIONS (LocalStorage) ---

const getRemindersForUser = (userId: string): Reminder[] => {
    try {
        return JSON.parse(localStorage.getItem(REMINDERS_KEY_PREFIX + userId) || '[]');
    } catch {
        return [];
    }
};

const saveRemindersForUser = (userId: string, reminders: Reminder[]) => {
    localStorage.setItem(REMINDERS_KEY_PREFIX + userId, JSON.stringify(reminders));
};

export const setReminder = async (userId: string, data: Omit<Reminder, 'id' | 'status' | 'takenAt' | 'alerted'>): Promise<string> => {
    const reminders = getRemindersForUser(userId);
    const newReminder: Reminder = {
        ...data,
        id: generateId(),
        status: 'pending',
        takenAt: null,
        alerted: false,
    };
    reminders.push(newReminder);
    saveRemindersForUser(userId, reminders);
    return newReminder.id;
};

export const getReminder = async (userId: string, id: string): Promise<Reminder | null> => {
    const reminders = getRemindersForUser(userId);
    return reminders.find(r => r.id === id) || null;
};

export const updateReminder = async (userId: string, id: string, updates: Partial<Reminder>): Promise<void> => {
    let reminders = getRemindersForUser(userId);
    reminders = reminders.map(r => r.id === id ? { ...r, ...updates } : r);
    saveRemindersForUser(userId, reminders);
};

export const getReminders = async (userId: string): Promise<Reminder[]> => {
    const reminders = getRemindersForUser(userId);
    return reminders.sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
};


// --- ORDER FUNCTIONS (LocalStorage) ---

const getOrdersForUser = (userId: string): Order[] => {
    try {
        return JSON.parse(localStorage.getItem(ORDERS_KEY_PREFIX + userId) || '[]');
    } catch {
        return [];
    }
};

const saveOrdersForUser = (userId: string, orders: Order[]) => {
    localStorage.setItem(ORDERS_KEY_PREFIX + userId, JSON.stringify(orders));
};


export const placeOrder = async (
    userId: string, 
    hospitalName: string, 
    items: CartItem[], 
    total: number,
    deliveryAddress: string,
    deliveryDate: string,
    deliveryTime: string
): Promise<Order> => {
    const orders = getOrdersForUser(userId);
    const newOrder: Order = {
        id: generateId(),
        date: new Date().toISOString(),
        hospitalName,
        items,
        total,
        deliveryAddress,
        deliveryDate,
        deliveryTime,
    };
    orders.push(newOrder);
    saveOrdersForUser(userId, orders);
    return newOrder;
};

export const getOrderHistory = async (userId: string): Promise<Order[]> => {
    const orders = getOrdersForUser(userId);
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// --- VITALS FUNCTIONS (LocalStorage) ---

const getVitalsForUser = (userId: string): Vital[] => {
    try {
        return JSON.parse(localStorage.getItem(VITALS_KEY_PREFIX + userId) || '[]');
    } catch {
        return [];
    }
};

const saveVitalsForUser = (userId: string, vitals: Vital[]) => {
    localStorage.setItem(VITALS_KEY_PREFIX + userId, JSON.stringify(vitals));
};

export const addVitalReading = async (userId: string, data: Omit<Vital, 'id' | 'userId'>): Promise<Vital> => {
    const vitals = getVitalsForUser(userId);
    const newVital: Vital = {
        ...data,
        id: generateId(),
        userId,
    };
    vitals.push(newVital);
    saveVitalsForUser(userId, vitals);
    return newVital;
};

export const getVitals = async (userId: string): Promise<Vital[]> => {
    const vitals = getVitalsForUser(userId);
    return vitals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};