import React, { useState, useEffect } from 'react';
import type { Hospital, AppointmentDetails } from '../../types';
import Card from '../common/Card';
import { useTranslations } from '../hooks/useTranslations';
import { useApp } from '../hooks/useApp';

interface AppointmentSchedulerProps {
  hospital: Hospital;
  onSchedule: (details: Omit<AppointmentDetails, 'hospital' | 'date' | 'time' | 'appointmentType'>) => void;
  onBack: () => void;
  initialDetails: Partial<Omit<AppointmentDetails, 'hospital'>>;
  consultationFee: number;
}

type Errors = {
    patientName?: string;
    patientAge?: string;
    phone?: string;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ hospital, onSchedule, onBack, initialDetails, consultationFee }) => {
  const t = useTranslations();
  const { conversationalForm } = useApp();
  const activeField = conversationalForm?.fields[conversationalForm.currentIndex]?.id;

  const [patientName, setPatientName] = useState(initialDetails.patientName || '');
  const [patientAge, setPatientAge] = useState(initialDetails.patientAge || '');
  const [phone, setPhone] = useState(initialDetails.phone || '');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00 AM');
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    setPatientName(initialDetails.patientName || '');
    setPatientAge(initialDetails.patientAge || '');
    setPhone(initialDetails.phone || '');
  }, [initialDetails]);
  
  // Update local state when conversational form provides new values
  useEffect(() => {
    if (conversationalForm?.formId === 'booking_flow') {
      const nameField = conversationalForm.fields.find(f => f.id === 'patientName');
      const ageField = conversationalForm.fields.find(f => f.id === 'patientAge');
      const phoneField = conversationalForm.fields.find(f => f.id === 'phone');
      if (nameField?.value) setPatientName(nameField.value);
      if (ageField?.value) setPatientAge(ageField.value);
      if (phoneField?.value) setPhone(phoneField.value);
    }
  }, [conversationalForm]);


  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];
  
  const validate = () => {
    const newErrors: Errors = {};
    if (!patientName.trim()) newErrors.patientName = t('fieldRequired');
    const ageNum = parseInt(patientAge, 10);
    if (!patientAge.trim()) newErrors.patientAge = t('fieldRequired');
    else if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) newErrors.patientAge = t('invalidAge');
    if (!phone.trim()) newErrors.phone = t('fieldRequired');
    else if (!/^\d{10}$/.test(phone)) newErrors.phone = t('invalidPhone');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSchedule({ patientName, patientAge, phone });
    }
  };
  
  const isFormComplete = patientName && patientAge && phone;
  const isEmergency = initialDetails.appointmentType === 'emergency';

  const getInputClass = (fieldName: string) => {
      const baseClass = `w-full p-3 border rounded-lg transition-all duration-300 bg-white`;
      if(activeField === fieldName) return `${baseClass} border-primary ring-2 ring-primary/50`;
      if(errors[fieldName as keyof Errors]) return `${baseClass} border-red-500`;
      return `${baseClass} border-gray-300`;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="text-primary mb-4 font-semibold">&larr; Back to Hospitals</button>
      <h2 className="text-3xl font-bold text-dark mb-6">{t('bookYourAppointment')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold text-lg mb-4">{t('patientInfo')}</h3>
              <div className="space-y-4">
                <div>
                  <input type="text" placeholder={t('patientName')} value={patientName} onChange={e => setPatientName(e.target.value)} className={getInputClass('patientName')} />
                  {errors.patientName && <p className="text-red-500 text-xs mt-1">{errors.patientName}</p>}
                </div>
                <div>
                  <input type="number" placeholder={t('patientAge')} value={patientAge} onChange={e => setPatientAge(e.target.value)} className={getInputClass('patientAge')} />
                  {errors.patientAge && <p className="text-red-500 text-xs mt-1">{errors.patientAge}</p>}
                </div>
                <div>
                  <input type="tel" placeholder={t('phone')} value={phone} onChange={e => setPhone(e.target.value)} className={getInputClass('phone')} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
            </Card>
            <Card>
              <h3 className="font-bold text-lg mb-4">{t('selectDateTime')}</h3>
              <input type="date" value={selectedDate.toISOString().split('T')[0]} onChange={e => setSelectedDate(new Date(e.target.value))} className="w-full p-3 border rounded-lg mb-4" />
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map(time => (
                  <button key={time} type="button" onClick={() => setSelectedTime(time)} className={`p-2 rounded-lg text-sm ${selectedTime === time ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                    {time}
                  </button>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
                <h3 className="font-bold text-lg mb-4">{hospital.name}</h3>
                <p className="text-gray-500">{hospital.address}</p>
            </Card>
            <Card>
                <h3 className="font-bold text-lg mb-4">{t('paymentDetails')}</h3>
                <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between">
                        <span>{isEmergency ? t('emergencyFee') : t('consultationFee')}</span>
                        <strong>{`₹${consultationFee}`}</strong>
                    </div>
                    <hr className="my-2"/>
                    <div className="flex justify-between font-bold text-dark text-lg">
                        <span>{t('totalCost')}</span>
                        <strong>{`₹${consultationFee}`}</strong>
                    </div>
                </div>
            </Card>
            <button type="submit" disabled={!isFormComplete} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                {t('proceedToPayment')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AppointmentScheduler;