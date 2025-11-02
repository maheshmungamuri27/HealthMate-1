import React, { useState, useEffect } from 'react';
import type { Hospital, AppointmentDetails } from '../types';
import HospitalList from './booking/HospitalList';
import AppointmentScheduler from './booking/AppointmentScheduler';
import Confirmation from './booking/Confirmation';
import Payment from './booking/Payment';
import { HOSPITALS } from '../constants';
import Card from './common/Card';
import { useTranslations } from '../hooks/useTranslations';
import { useApp } from '../hooks/useApp';

type BookingStep = 'typeSelection' | 'list' | 'schedule' | 'payment' | 'confirm';

const NORMAL_FEE = 50;
const EMERGENCY_FEE = 250;

const Booking: React.FC = () => {
  const t = useTranslations();
  const { voiceAction, setVoiceAction, startConversationalForm } = useApp();
  const [step, setStep] = useState<BookingStep>('typeSelection');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<Partial<Omit<AppointmentDetails, 'hospital'>>>({});
  const [fullAppointmentDetails, setFullAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [finalFee, setFinalFee] = useState(0);

  useEffect(() => {
    // This effect starts the voice-driven form once the user has manually selected a hospital
    // and landed on the scheduling step.
    if (voiceAction === 'initiate_booking_flow' && step === 'schedule') {
        setVoiceAction(null); // Consume the action

        const fields = [
            { id: 'patientName', question: t('whatIsPatientName') },
            { id: 'patientAge', question: t('whatIsPatientAge') },
            { id: 'phone', question: t('whatIsPhoneNumber') },
        ];

        const onComplete = (formData: Record<string, any>) => {
            console.log("Conversational form complete!", formData);
            // We have the data, now update state and move to payment
            handleScheduleSubmit(formData as any);
        };
        
        startConversationalForm('booking_flow', fields, onComplete);
    }
  }, [voiceAction, setVoiceAction, startConversationalForm, t, step]);


  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setStep('schedule');
    // After manually selecting a hospital, we can trigger the voice form
    // if the user originally intended to book by voice.
    setVoiceAction('initiate_booking_flow');
  };

  const handleScheduleSubmit = (details: Omit<AppointmentDetails, 'hospital' | 'date' | 'time' | 'appointmentType'>) => {
    if (selectedHospital && appointmentDetails.appointmentType) {
      const finalDetails = { ...appointmentDetails, ...details, date: new Date(), time: "10:00 AM" };
      setAppointmentDetails(finalDetails);
      setStep('payment');
    }
  };
  
  const handlePaymentSuccess = () => {
    const consultationFee = appointmentDetails.appointmentType === 'emergency' ? EMERGENCY_FEE : NORMAL_FEE;
    if (selectedHospital && appointmentDetails.date && appointmentDetails.time && appointmentDetails.patientName) {
        setFullAppointmentDetails({ ...appointmentDetails, hospital: selectedHospital } as AppointmentDetails);
        setFinalFee(consultationFee);
        setStep('confirm');
    }
  };

  const handleBookAnother = () => {
    setStep('typeSelection');
    setSelectedHospital(null);
    setAppointmentDetails({});
    setFullAppointmentDetails(null);
    setFinalFee(0);
  };
  
  const handleGoBack = (targetStep: BookingStep) => {
    setStep(targetStep);
  }
  
  const selectAppointmentType = (type: 'normal' | 'emergency') => {
      setAppointmentDetails({ appointmentType: type });
      setStep('list');
  }

  const renderStep = () => {
    const consultationFee = appointmentDetails.appointmentType === 'emergency' ? EMERGENCY_FEE : NORMAL_FEE;

    switch (step) {
      case 'typeSelection':
          return (
              <div className="max-w-md mx-auto text-center">
                  <h2 className="text-3xl font-bold text-dark mb-6">{t('appointmentType')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => selectAppointmentType('normal')}>
                          <h3 className="text-2xl font-bold text-primary mb-2">{t('normalAppointment')}</h3>
                          <p>Consultation Fee: ₹{NORMAL_FEE}</p>
                      </Card>
                      <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => selectAppointmentType('emergency')}>
                           <h3 className="text-2xl font-bold text-red-600 mb-2">{t('emergencyAppointment')}</h3>
                           <p>Immediate assistance (Fee: ₹{EMERGENCY_FEE})</p>
                      </Card>
                  </div>
              </div>
          );
      case 'list':
        return <HospitalList hospitals={HOSPITALS} onSelectHospital={handleSelectHospital} onBack={() => handleGoBack('typeSelection')} />;
      case 'schedule':
        if (selectedHospital) {
          return <AppointmentScheduler 
                    hospital={selectedHospital} 
                    onSchedule={handleScheduleSubmit} 
                    onBack={() => handleGoBack('list')}
                    initialDetails={appointmentDetails}
                    consultationFee={consultationFee}
                 />;
        }
        return null;
      case 'payment':
        return <Payment 
                    amount={consultationFee} 
                    onPaymentSuccess={handlePaymentSuccess} 
                    onBack={() => handleGoBack('schedule')} 
               />;
      case 'confirm':
        if (fullAppointmentDetails) {
          return <Confirmation details={fullAppointmentDetails} amountPaid={finalFee} onBookAnother={handleBookAnother} />;
        }
        return null;
      default:
        return null;
    }
  };

  return <div>{renderStep()}</div>;
};

export default Booking;