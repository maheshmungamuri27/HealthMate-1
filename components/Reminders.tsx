import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { Reminder } from '../types';
import Card from './common/Card';
import Icon from './common/Icon';
import { 
    setReminder as createReminder, 
    getReminder as fetchReminder, 
    updateReminder as updateReminderDoc, 
    getReminders
} from '../services/mockApiService';
import { useApp } from '../hooks/useApp';

type View = 'menu' | 'set' | 'check' | 'status' | 'tracker';

const Reminders: React.FC = () => {
    const t = useTranslations();
    const { user, language, voiceAction, setVoiceAction, startConversationalForm, conversationalForm } = useApp();
    const [view, setView] = useState<View>('menu');
    const [allReminders, setAllReminders] = useState<Reminder[]>([]);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [reminder, setReminder] = useState<Reminder | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    
    const [alertedReminder, setAlertedReminder] = useState<Reminder | null>(null);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

    // Form states
    const [patientName, setPatientName] = useState('');
    const [medicineName, setMedicineName] = useState('');
    const [dosage, setDosage] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('09:00');
    const [checkId, setCheckId] = useState('');
    
    // Tracker states
    const [searchedPatient, setSearchedPatient] = useState('');
    const [patientHistory, setPatientHistory] = useState<Reminder[] | null>(null);
    const [trackerSearchTerm, setTrackerSearchTerm] = useState('');

    const activeField = conversationalForm?.fields[conversationalForm.currentIndex]?.id;
    
    const loadReminders = async () => {
        if (user) {
            setIsLoading(true);
            const reminders = await getReminders(user.uid);
            setAllReminders(reminders);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReminders();
    }, [user]);

    useEffect(() => {
        if (conversationalForm?.formId === 'reminder_flow') {
            const patientNameField = conversationalForm.fields.find(f => f.id === 'patientName');
            const medicineNameField = conversationalForm.fields.find(f => f.id === 'medicineName');
            const dosageField = conversationalForm.fields.find(f => f.id === 'dosage');
            const timeField = conversationalForm.fields.find(f => f.id === 'time');
            const dateField = conversationalForm.fields.find(f => f.id === 'date');

            if (patientNameField?.value) setPatientName(patientNameField.value);
            if (medicineNameField?.value) setMedicineName(medicineNameField.value);
            if (dosageField?.value) setDosage(dosageField.value);
            // NOTE: The voice command prompt asks for natural language time/date.
            // This will just put the raw string in the input for now, which is fine for this task.
            if (timeField?.value) setTime(timeField.value);
            if (dateField?.value) setDate(dateField.value);
        }
    }, [conversationalForm]);

    useEffect(() => {
        if (voiceAction === 'initiate_reminder_flow') {
            setVoiceAction(null); // Consume the action
            setView('set'); // Switch to the form view
            
            const fields = [
                { id: 'patientName', question: 'Who is this reminder for?' },
                { id: 'medicineName', question: 'What is the name of the medicine?' },
                { id: 'dosage', question: 'What is the dosage?' },
                { id: 'time', question: 'At what time? For example, say 9:30 AM or 10 PM.' },
                { id: 'date', question: 'On which date? For example, say tomorrow, or July 25th.' },
            ];
            
            const onComplete = async (formData: Record<string, any>) => {
                if (!user) return;
                setIsLoading(true);
                // TODO: Parse date/time from natural language
                const newId = await createReminder(user.uid, { 
                    patientName: formData.patientName, 
                    medicineName: formData.medicineName, 
                    dosage: formData.dosage, 
                    time: '14:00', // Placeholder
                    date: new Date().toISOString().split('T')[0] // Placeholder
                });
                setCurrentId(newId);
                await loadReminders();
                setIsLoading(false);
                 // Keep the user on the "set" view to see the confirmation
            };

            startConversationalForm('reminder_flow', fields, onComplete);
        }
    }, [voiceAction, setVoiceAction, startConversationalForm, user]);

    useEffect(() => {
      const interval = setInterval(async () => {
        const now = new Date();
        
        for (const rem of allReminders) {
          if (rem.status === 'pending' && !rem.alerted) {
            const reminderDateTime = new Date(`${rem.date}T${rem.time}`);
            if (now >= reminderDateTime) {
              setAlertedReminder(rem);
              setIsAlertModalOpen(true);
              if (user) await updateReminderDoc(user.uid, rem.id, { alerted: true });

              const langCode = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
              const message = `${rem.patientName}, it's time to take your ${rem.medicineName}. Please confirm if you have taken your medicine.`;
              const utterance = new SpeechSynthesisUtterance(message);
              utterance.lang = langCode;
              window.speechSynthesis.speak(utterance);
              break; 
            }
          }
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }, [allReminders, language, user]);

    const handleSetReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        const newId = await createReminder(user.uid, { patientName, medicineName, dosage, time, date });
        setCurrentId(newId);
        await loadReminders();
        setIsLoading(false);
    };

    const handleCheckReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        setError('');
        const foundReminder = await fetchReminder(user.uid, checkId);
        if (foundReminder) {
            setReminder(foundReminder);
            setView('status');
        } else {
            setError(t('notFound'));
        }
        setIsLoading(false);
    };

    const updateAndRefreshReminder = async (id: string, updates: Partial<Reminder>) => {
        if (!user) return;
        setIsLoading(true);
        await updateReminderDoc(user.uid, id, updates);
        const updatedReminder = await fetchReminder(user.uid, id);
        if (updatedReminder) setReminder(updatedReminder);
        await loadReminders();
        setIsLoading(false);
    };

    const handleMarkAsTaken = async (id: string) => {
        await updateAndRefreshReminder(id, { status: 'taken', takenAt: new Date().toISOString() });
        if(isAlertModalOpen) setIsAlertModalOpen(false);
    };
    
    const handleMarkAsMissed = async (id: string) => {
        await updateAndRefreshReminder(id, { status: 'missed' });
        if(isAlertModalOpen) setIsAlertModalOpen(false);
    }
    
    const handleSearchHistory = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSearchedPatient(trackerSearchTerm);
        const history = allReminders.filter(r => r.patientName.toLowerCase() === trackerSearchTerm.toLowerCase());
        setPatientHistory(history);
        setIsLoading(false);
    }

    const resetToMenu = () => {
        setView('menu');
        setCurrentId(null);
        setReminder(null);
        setError('');
        setPatientName('');
        setMedicineName('');
        setDosage('');
        setTime('09:00');
        setCheckId('');
        setPatientHistory(null);
        setSearchedPatient('');
        setTrackerSearchTerm('');
    };
    
    const copyToClipboard = () => {
        if(currentId){
            navigator.clipboard.writeText(currentId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    const getInputClass = (fieldName: string) => {
        const baseClass = `mt-1 w-full p-3 border rounded-lg transition-all duration-300 bg-white`;
        if (activeField === fieldName && conversationalForm?.formId === 'reminder_flow') {
            return `${baseClass} border-primary ring-2 ring-primary/50`;
        }
        return `${baseClass} border-gray-300`;
    };
    
    // Calendar Logic
    const [currentDate, setCurrentDate] = useState(new Date());

    const getMonthData = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const remindersByDay: Record<string, { taken: number; pending: number; missed: number, total: number }> = {};
        
        patientHistory?.forEach(rem => {
            const remDate = new Date(rem.date + 'T00:00:00');
            if (remDate.getFullYear() === year && remDate.getMonth() === month) {
                const day = remDate.getDate();
                if (!remindersByDay[day]) {
                    remindersByDay[day] = { taken: 0, pending: 0, missed: 0, total: 0 };
                }
                remindersByDay[day][rem.status]++;
                remindersByDay[day].total++;
            }
        });

        return { year, month, firstDay, daysInMonth, remindersByDay };
    }
    
    const { year, month, firstDay, daysInMonth, remindersByDay } = patientHistory ? getMonthData() : { year:0, month:0, firstDay:0, daysInMonth:0, remindersByDay: {} };
    const monthName = t(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][month] as any);
    const dayNames = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
    
    const [selectedDayDetails, setSelectedDayDetails] = useState<Reminder[] | null>(null);

    const handleDayClick = (day: number) => {
        const dayReminders = patientHistory?.filter(r => new Date(r.date + 'T00:00:00').getDate() === day);
        setSelectedDayDetails(dayReminders || []);
    }

    if (view === 'status' && reminder) {
        return (
            <div className="max-w-md mx-auto">
                <button onClick={resetToMenu} className="text-primary font-semibold mb-4">&larr; {t('backToReminders')}</button>
                <Card>
                    <h2 className="text-2xl font-bold text-dark mb-4 text-center">{t('reminderDetails')}</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-gray-500">{t('patientName')}:</span><strong className="text-dark">{reminder.patientName}</strong></div>
                        <div className="flex justify-between"><span className="text-gray-500">{t('medicineName')}:</span><strong className="text-dark">{reminder.medicineName}</strong></div>
                        <div className="flex justify-between"><span className="text-gray-500">{t('dosage')}:</span><strong className="text-dark">{reminder.dosage}</strong></div>
                        <div className="flex justify-between"><span className="text-gray-500">{t('time')}:</span><strong className="text-dark">{new Date(`1970-01-01T${reminder.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">{t('status')}:</span>
                             {reminder.status === 'pending' ? <span className="px-3 py-1 text-sm font-semibold text-orange-700 bg-orange-100 rounded-full">{t('pending')}</span> : 
                             reminder.status === 'taken' ? <span className="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full">{t('taken')}</span> :
                             <span className="px-3 py-1 text-sm font-semibold text-red-700 bg-red-100 rounded-full">{t('missed')}</span>
                             }
                        </div>
                        {reminder.takenAt && <div className="text-center text-sm text-gray-500 pt-2 border-t mt-2">Taken on {new Date(reminder.takenAt).toLocaleString()}</div>}
                    </div>
                    {reminder.status === 'pending' && (
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => handleMarkAsTaken(reminder.id)} disabled={isLoading} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400">
                               {isLoading ? '...' : t('taken')}
                            </button>
                             <button onClick={() => handleMarkAsMissed(reminder.id)} disabled={isLoading} className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400">
                               {isLoading ? '...' : t('missed')}
                            </button>
                        </div>
                    )}
                </Card>
            </div>
        )
    }

    return (
      <>
        {isAlertModalOpen && alertedReminder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <Card className="w-full max-w-sm">
                    <h2 className="text-xl font-bold text-center mb-4">{t('alertTitle')}</h2>
                    <p className="text-center text-gray-600 mb-2">Patient: {alertedReminder.patientName}</p>
                    <p className="text-center text-gray-600 mb-6">It's time for <strong className="text-dark">{alertedReminder.medicineName}</strong> ({alertedReminder.dosage})</p>
                    <div className="flex gap-4">
                        <button onClick={() => handleMarkAsTaken(alertedReminder.id)} className="w-full bg-green-500 text-white font-bold py-2 rounded-lg">{t('taken')}</button>
                        <button onClick={() => handleMarkAsMissed(alertedReminder.id)} className="w-full bg-red-500 text-white font-bold py-2 rounded-lg">{t('missed')}</button>
                    </div>
                </Card>
            </div>
        )}
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-dark">{t('medicineReminders')}</h1>
            {view === 'menu' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="flex flex-col items-center text-center p-8 space-y-4">
                        <Icon name="bell" className="w-12 h-12 text-primary"/>
                        <h2 className="text-xl font-bold">{t('setNewReminder')}</h2>
                        <button onClick={() => setView('set')} className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors">
                            {t('setNewReminder')}
                        </button>
                    </Card>
                     <Card className="flex flex-col items-center text-center p-8 space-y-4">
                        <Icon name="scan" className="w-12 h-12 text-primary"/>
                        <h2 className="text-xl font-bold">{t('checkReminderStatus')}</h2>
                        <button onClick={() => setView('check')} className="w-full bg-secondary text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors">
                            {t('checkReminderStatus')}
                        </button>
                    </Card>
                    <Card className="flex flex-col items-center text-center p-8 space-y-4 md:col-span-2 lg:col-span-1">
                        <Icon name="calendar" className="w-12 h-12 text-primary"/>
                        <h2 className="text-xl font-bold">{t('adherenceTracker')}</h2>
                        <button onClick={() => setView('tracker')} className="w-full bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors">
                            {t('adherenceTracker')}
                        </button>
                    </Card>
                 </div>
            )}

            {view === 'set' && (
                <Card>
                    <button onClick={resetToMenu} className="text-primary font-semibold mb-4">&larr; {t('backToReminders')}</button>
                    {!currentId ? (
                        <form onSubmit={handleSetReminder} className="space-y-4">
                            <h2 className="text-xl font-bold">{t('setNewReminder')}</h2>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">{t('patientName')}</label>
                                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g., Mom" className={getInputClass('patientName')} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('medicineName')}</label>
                                <input type="text" value={medicineName} onChange={e => setMedicineName(e.target.value)} placeholder="e.g., Paracetamol" className={getInputClass('medicineName')} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('dosage')}</label>
                                <input type="text" value={dosage} onChange={e => setDosage(e.target.value)} placeholder={t('dosage')} className={getInputClass('dosage')} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('date')}</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={getInputClass('date')} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('time')}</label>
                                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className={getInputClass('time')} required />
                                </div>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-400">
                                {isLoading ? '...' : t('generateReminder')}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center p-4">
                             <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <h2 className="text-2xl font-bold text-dark">{t('reminderGenerated')}</h2>
                            <p className="text-gray-600 my-4">Your reminder is saved and will sync across devices.</p>
                            <div className="relative bg-gray-100 p-4 rounded-lg">
                                <span className="font-mono text-xl font-bold tracking-widest">{currentId}</span>
                                <button onClick={copyToClipboard} className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 text-gray-700 text-xs font-bold py-1 px-3 rounded-md hover:bg-gray-300">
                                    {copied ? t('copied') : t('copyId')}
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

             {view === 'check' && (
                <Card>
                    <button onClick={resetToMenu} className="text-primary font-semibold mb-4">&larr; {t('backToReminders')}</button>
                    <form onSubmit={handleCheckReminder} className="space-y-4">
                        <h2 className="text-xl font-bold">{t('checkReminderStatus')}</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('enterReminderId')}</label>
                            <input type="text" value={checkId} onChange={e => setCheckId(e.target.value)} placeholder="Enter ID from creation" className="mt-1 w-full p-3 border rounded-lg" required />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400">
                            {isLoading ? '...' : t('checkStatus')}
                        </button>
                    </form>
                </Card>
            )}

            {view === 'tracker' && (
                <Card>
                     <button onClick={resetToMenu} className="text-primary font-semibold mb-4">&larr; {t('backToReminders')}</button>
                     <h2 className="text-xl font-bold mb-4">{t('adherenceTracker')}</h2>
                     <form onSubmit={handleSearchHistory} className="flex gap-2 mb-6">
                        <input type="text" value={trackerSearchTerm} onChange={e => setTrackerSearchTerm(e.target.value)} placeholder={t('searchPatient')} className="flex-grow p-3 border rounded-lg" required/>
                        <button type="submit" disabled={isLoading} className="bg-primary text-white font-bold py-3 px-6 rounded-lg">{t('search')}</button>
                     </form>
                     
                     {isLoading && <p>Loading...</p>}

                     {patientHistory && (
                         <div>
                            <h3 className="text-lg font-bold mb-4">{t('patientHistory')} {searchedPatient}</h3>
                            {patientHistory.length === 0 ? <p>{t('noHistory')}</p> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="text-primary">&larr;</button>
                                            <h4 className="font-bold">{monthName} {year}</h4>
                                            <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="text-primary">&rarr;</button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                                            {dayNames.map(d => <div key={d}>{d}</div>)}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                                const day = i + 1;
                                                const dayData = remindersByDay[day];
                                                let bgColor = 'bg-gray-100';
                                                if (dayData) {
                                                    if (dayData.missed > 0) bgColor = 'bg-red-200';
                                                    else if (dayData.pending > 0) bgColor = 'bg-yellow-200';
                                                    else if (dayData.taken > 0) bgColor = 'bg-green-200';
                                                }
                                                return <button onClick={() => handleDayClick(day)} key={day} className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${bgColor} hover:ring-2 ring-primary`}>{day}</button>
                                            })}
                                        </div>
                                    </div>
                                    {selectedDayDetails && (
                                        <div>
                                            <h4 className="font-bold mb-2">Details for {monthName} {selectedDayDetails[0] && new Date(selectedDayDetails[0].date+'T00:00:00').getDate()}</h4>
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {selectedDayDetails.map(r => (
                                                    <div key={r.id} className="p-2 bg-gray-50 rounded-md text-sm">
                                                        <p className="font-semibold">{r.medicineName}</p>
                                                        <p>Time: {new Date(`1970-01-01T${r.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        <p>Status: {r.status} {r.takenAt ? `at ${new Date(r.takenAt).toLocaleTimeString()}`: ''}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                         </div>
                     )}

                </Card>
            )}

        </div>
      </>
    );
};

export default Reminders;