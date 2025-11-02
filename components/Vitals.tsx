
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslations } from '../hooks/useTranslations';
import type { Vital, VitalType, VitalReadingValue } from '../types';
import { getVitals, addVitalReading } from '../services/mockApiService';
import Card from './common/Card';
import Icon from './common/Icon';

const Vitals: React.FC = () => {
    const t = useTranslations();
    const { user, language } = useApp();
    const [vitals, setVitals] = useState<Vital[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormVisible, setFormVisible] = useState(false);

    // Form State
    const [vitalType, setVitalType] = useState<VitalType>('blood_pressure');
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');
    const [reading, setReading] = useState('');

    const vitalConfigs = {
        blood_pressure: { unit: 'mmHg', name: t('bloodPressure') },
        blood_sugar: { unit: 'mg/dL', name: t('bloodSugar') },
        heart_rate: { unit: 'bpm', name: t('heartRate') },
        weight: { unit: 'kg', name: t('weight') },
    };

    useEffect(() => {
        const fetchVitals = async () => {
            if (user) {
                setIsLoading(true);
                const userVitals = await getVitals(user.uid);
                setVitals(userVitals);
                setIsLoading(false);
            }
        };
        fetchVitals();
    }, [user]);

    const resetForm = () => {
        setVitalType('blood_pressure');
        setSystolic('');
        setDiastolic('');
        setReading('');
    };

    const handleSaveVital = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        let value: VitalReadingValue = {};
        let isValid = false;
        if (vitalType === 'blood_pressure') {
            const sys = parseInt(systolic);
            const dia = parseInt(diastolic);
            if (!isNaN(sys) && !isNaN(dia)) {
                value = { systolic: sys, diastolic: dia };
                isValid = true;
            }
        } else {
            const r = parseInt(reading);
            if (!isNaN(r)) {
                value = { reading: r };
                isValid = true;
            }
        }

        if (isValid) {
            await addVitalReading(user.uid, {
                type: vitalType,
                date: new Date().toISOString(),
                value,
                unit: vitalConfigs[vitalType].unit,
            });
            const updatedVitals = await getVitals(user.uid);
            setVitals(updatedVitals);
            setFormVisible(false);
            resetForm();
        } else {
            alert('Please enter valid numbers.');
        }
    };

    const groupedVitals = useMemo(() => {
        return vitals.reduce((acc, vital) => {
            if (!acc[vital.type]) {
                acc[vital.type] = [];
            }
            acc[vital.type].push(vital);
            return acc;
        }, {} as Record<VitalType, Vital[]>);
    }, [vitals]);

    const dateFormatter = useMemo(() => 
        new Intl.DateTimeFormat(language, { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
        }), 
    [language]);
    
    const renderVitalValue = (vital: Vital) => {
        if (vital.type === 'blood_pressure') {
            return `${vital.value.systolic}/${vital.value.diastolic}`;
        }
        return `${vital.value.reading}`;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-dark">{t('vitalsTracker')}</h1>
                <button 
                    onClick={() => setFormVisible(!isFormVisible)}
                    className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors"
                >
                    {isFormVisible ? 'Cancel' : t('addNewVital')}
                </button>
            </header>

            {isFormVisible && (
                <Card>
                    <form onSubmit={handleSaveVital} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('selectVitalType')}</label>
                            <select 
                                value={vitalType} 
                                onChange={(e) => setVitalType(e.target.value as VitalType)}
                                className="mt-1 w-full p-3 border rounded-lg bg-white"
                            >
                                <option value="blood_pressure">{t('bloodPressure')}</option>
                                <option value="blood_sugar">{t('bloodSugar')}</option>
                                <option value="heart_rate">{t('heartRate')}</option>
                                <option value="weight">{t('weight')}</option>
                            </select>
                        </div>

                        {vitalType === 'blood_pressure' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('systolic')}</label>
                                    <input type="number" value={systolic} onChange={e => setSystolic(e.target.value)} className="mt-1 w-full p-3 border rounded-lg" placeholder="e.g., 120" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('diastolic')}</label>
                                    <input type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)} className="mt-1 w-full p-3 border rounded-lg" placeholder="e.g., 80" required />
                                </div>
                            </div>
                        ) : (
                             <div>
                                <label className="block text-sm font-medium text-gray-700">{t('reading')} ({vitalConfigs[vitalType].unit})</label>
                                <input type="number" value={reading} onChange={e => setReading(e.target.value)} className="mt-1 w-full p-3 border rounded-lg" placeholder="e.g., 98" required />
                            </div>
                        )}
                        
                        <button type="submit" className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors">
                            {t('saveVital')}
                        </button>
                    </form>
                </Card>
            )}

            {isLoading ? (
                <p>{t('loading')}...</p>
            ) : vitals.length === 0 ? (
                <Card className="text-center py-12">
                    <Icon name="vitals" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">{t('noVitals')}</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedVitals).map(([type, readings]) => (
                        <Card key={type}>
                            <h2 className="text-xl font-bold mb-4">{vitalConfigs[type as VitalType].name}</h2>
                            <ul className="space-y-3">
                                {readings.map(vital => (
                                    <li key={vital.id} className="flex justify-between items-center p-3 bg-light rounded-lg">
                                        <div>
                                            <span className="text-2xl font-bold">{renderVitalValue(vital)}</span>
                                            <span className="ml-2 text-gray-500">{vital.unit}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">{dateFormatter.format(new Date(vital.date))}</p>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Vitals;
