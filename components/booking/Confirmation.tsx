import React from 'react';
import type { AppointmentDetails } from '../../types';
import Card from '../common/Card';
import { useTranslations } from '../hooks/useTranslations';
import { useApp } from '../hooks/useApp';

interface ConfirmationProps {
  details: AppointmentDetails;
  amountPaid: number;
  onBookAnother: () => void;
}

const Confirmation: React.FC<ConfirmationProps> = ({ details, amountPaid, onBookAnother }) => {
  const t = useTranslations();
  const { changePage } = useApp();
  const isEmergency = details.appointmentType === 'emergency';
  
  return (
    <div className="max-w-lg mx-auto text-center">
      <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <h2 className="text-3xl font-bold text-dark mb-2">{t('appointmentConfirmed')}</h2>
      <p className="text-gray-500">{t('smsSent')}</p>
      <p className="text-sm text-gray-500 mb-6">Date and time reminders have also been scheduled.</p>
      
      <Card className="text-left space-y-4">
        <h3 className="font-bold text-lg border-b pb-2">Appointment Details</h3>
        <div className="flex justify-between">
          <span className="text-gray-500">Hospital:</span>
          <span className="font-semibold text-right">{details.hospital.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Type:</span>
          <span className={`font-semibold ${isEmergency ? 'text-red-600' : 'text-primary'}`}>{details.appointmentType.charAt(0).toUpperCase() + details.appointmentType.slice(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date & Time:</span>
          <span className="font-semibold">{details.date.toLocaleDateString()}, {details.time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Patient:</span>
          <span className="font-semibold">{details.patientName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Payment:</span>
          <span className="font-semibold text-green-600">Confirmed - {amountPaid > 0 ? `₹${amountPaid}` : 'Free'}</span>
        </div>
      </Card>
      <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={() => changePage('reminders')} className="bg-secondary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
            {t('setAppointmentReminder')}
        </button>
        <button onClick={onBookAnother} className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors">
            Book Another Appointment
        </button>
      </div>
    </div>
  );
};

export default Confirmation;