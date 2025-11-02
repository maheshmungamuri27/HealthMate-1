import React, { useState, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import Card from '../common/Card';

interface PaymentProps {
  amount: number;
  onPaymentSuccess: () => void;
  onBack: () => void;
}

const Payment: React.FC<PaymentProps> = ({ amount, onPaymentSuccess, onBack }) => {
  const t = useTranslations();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (processing) {
      timer = setTimeout(() => {
        onPaymentSuccess();
      }, 2000); // Simulate confirmation time
    }
    return () => clearTimeout(timer);
  }, [processing, onPaymentSuccess]);

  const handleConfirm = () => {
    setProcessing(true);
  };
  
  if (processing) {
      return (
        <div className="max-w-md mx-auto text-center p-8">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary mx-auto"></div>
            <h2 className="text-2xl font-bold text-dark mt-4">Confirming Booking...</h2>
            <p className="text-gray-500">Please wait while we finalize your appointment.</p>
        </div>
      )
  }

  return (
    <div className="max-w-md mx-auto">
        <button onClick={onBack} className="text-primary mb-4 font-semibold">&larr; Back to Scheduler</button>
        <Card>
            <h2 className="text-2xl font-bold text-dark mb-4 text-center">{amount > 0 ? "Confirm Payment" : "Confirm Your Free Booking"}</h2>
            <div className="text-center mb-6">
                <p className="text-gray-500">Total Amount</p>
                <p className="text-4xl font-extrabold text-dark">
                    ₹{amount} {amount === 0 && <span className="text-lg font-medium text-green-600">(Free)</span>}
                </p>
            </div>

            <div className="space-y-4">
                <p className="font-semibold text-center text-gray-600">Finalize your appointment. A confirmation will be sent to your number.</p>
                <button onClick={handleConfirm} className="w-full flex items-center justify-center gap-2 bg-[#6739B7] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-transform hover:scale-105">
                    <span className="font-sans text-lg">Pay with PhonePe</span>
                </button>
                 <button onClick={handleConfirm} className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold py-3 rounded-lg hover:opacity-90 transition">
                   Pay with Paytm
                </button>
                 <button onClick={handleConfirm} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-50 transition">
                   Pay with Google Pay
                </button>
            </div>
        </Card>
    </div>
  );
};

export default Payment;