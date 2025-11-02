import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import type { Hospital, Medicine, CartItem, MedicineCategory } from '../../types';
import Card from './common/Card';
import Icon from './common/Icon';
import { HOSPITALS } from '../constants';
import { MEDICINES } from '../constants';
import { useApp } from '../../hooks/useApp';
import { placeOrder } from '../services/mockApiService';
import { getUniqueDistricts } from '../../lib/hospitalParser';

type OrderStep = 'hospital' | 'medicines' | 'delivery' | 'checkout';

const districts = getUniqueDistricts();

const OrderMedicine: React.FC = () => {
  const t = useTranslations();
  const { user, medicineSearchQuery, changePage, voiceAction, setVoiceAction, startConversationalForm, conversationalForm } = useApp();
  const [step, setStep] = useState<OrderStep>('hospital');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MedicineCategory | 'all'>('all');
  
  const [hospitalSearchTerm, setHospitalSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTime, setDeliveryTime] = useState('14:00');
  
  const activeField = conversationalForm?.fields[conversationalForm.currentIndex]?.id;

  useEffect(() => {
    setMedicineSearchTerm(medicineSearchQuery);
  }, [medicineSearchQuery]);

  useEffect(() => {
    if (voiceAction === 'checkout' && step === 'medicines' && cart.length > 0) {
        setVoiceAction(null);
        handleProceedToDelivery(true);
    }
  }, [voiceAction, setVoiceAction, step, cart.length]);

  useEffect(() => {
    if (conversationalForm?.formId === 'delivery_flow') {
      const addressField = conversationalForm.fields.find(f => f.id === 'deliveryAddress');
      const dateField = conversationalForm.fields.find(f => f.id === 'deliveryDate');
      const timeField = conversationalForm.fields.find(f => f.id === 'deliveryTime');

      if (addressField?.value) setDeliveryAddress(addressField.value);
      if (dateField?.value) setDeliveryDate(dateField.value);
      if (timeField?.value) setDeliveryTime(timeField.value);
    }
  }, [conversationalForm]);
  
  const handleProceedToDelivery = (isVoiceInitiated: boolean = false) => {
    setStep('delivery');
    if (isVoiceInitiated) {
        const fields = [
            { id: 'deliveryAddress', question: t('whatIsDeliveryAddress') },
            { id: 'deliveryDate', question: t('whatIsDeliveryDate') },
            { id: 'deliveryTime', question: t('whatIsDeliveryTime') },
        ];
        startConversationalForm('delivery_flow', fields, (formData) => {
            handleConfirmOrder(formData.deliveryAddress, formData.deliveryDate, formData.deliveryTime);
        });
    }
  }

  const handleConfirmOrder = async (address: string, date: string, time: string) => {
    if (!user || !selectedHospital || cart.length === 0) return;
    await placeOrder(user.uid, selectedHospital.name, cart, cartTotal, address, date, time);
    setDeliveryAddress(address);
    setDeliveryDate(date);
    setDeliveryTime(time);
    setStep('checkout');
  };

  const handleDeliveryFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryAddress && deliveryDate && deliveryTime) {
        handleConfirmOrder(deliveryAddress, deliveryDate, deliveryTime);
    } else {
        alert("Please fill in all delivery details.");
    }
  };

  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setStep('medicines');
  };

  const addToCart = (medicine: Medicine) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === medicine.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...medicine, quantity: 1 }];
    });
  };

  const filteredMedicines = useMemo(() => {
      let medicines = MEDICINES;
      if (selectedCategory !== 'all') {
          medicines = medicines.filter(med => med.category === selectedCategory);
      }
      if (medicineSearchTerm) {
          medicines = medicines.filter(med => med.name.toLowerCase().includes(medicineSearchTerm.toLowerCase()));
      }
      return medicines;
  }, [medicineSearchTerm, selectedCategory]);
  
  const filteredHospitals = useMemo(() => {
    let results = HOSPITALS;
    
    if (selectedDistrict !== 'All') {
        results = results.filter(h => h.district === selectedDistrict);
    }
    
    if (hospitalSearchTerm) {
      const lowercasedTerm = hospitalSearchTerm.toLowerCase();
      results = results.filter(hospital => 
          hospital.name.toLowerCase().includes(lowercasedTerm) ||
          hospital.district.toLowerCase().includes(lowercasedTerm)
      );
    }
    return results;
  }, [hospitalSearchTerm, selectedDistrict]);

  const categories: {id: MedicineCategory | 'all', label: string}[] = [
      {id: 'all', label: 'All'},
      {id: 'tablet', label: 'Tablets'},
      {id: 'syrup', label: 'Syrups'},
      {id: 'pain-relief', label: 'Pain Relief'},
      {id: 'general', label: 'General'},
  ]

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const getInputClass = (fieldName: string) => {
    const baseClass = `mt-1 w-full p-3 border rounded-lg transition-all duration-300 bg-white`;
    if (activeField === fieldName && conversationalForm?.formId === 'delivery_flow') {
        return `${baseClass} border-primary ring-2 ring-primary/50`;
    }
    return `${baseClass} border-gray-300`;
  };

  if (step === 'hospital') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-dark">{t('orderMedicine')}</h1>
        <h2 className="text-xl font-semibold text-gray-700">{t('selectPharmacy')}</h2>
         <div className="flex flex-col md:flex-row gap-4">
            <input
            type="text"
            placeholder={t('searchLocation')}
            value={hospitalSearchTerm}
            onChange={(e) => setHospitalSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <div className="relative">
                <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full md:w-64 appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                >
                    <option value="All">{t('allDistricts')}</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {filteredHospitals.map(hospital => (
                <Card key={`${hospital.id}-${hospital.name}`} className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-grow">
                        <h3 className="font-bold text-lg">{hospital.name}</h3>
                        <p className="text-gray-500 text-sm">{hospital.address}</p>
                    </div>
                    <button onClick={() => handleSelectHospital(hospital)} className="bg-primary text-white text-sm font-semibold py-2 px-6 rounded-lg mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">{t('select')}</button>
                </Card>
            ))}
        </div>
      </div>
    );
  }

  if (step === 'medicines' && selectedHospital) {
    return (
      <div className="max-w-5xl mx-auto">
        <button onClick={() => setStep('hospital')} className="text-primary font-semibold mb-4">&larr; Change Hospital</button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                 <input type="text" placeholder={t('searchMedicines')} value={medicineSearchTerm} onChange={e => setMedicineSearchTerm(e.target.value)} className="w-full p-3 border rounded-lg" />
                 <div className="flex flex-wrap gap-2 mb-4">
                     {categories.map(cat => (
                         <button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full ${selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            {cat.label}
                        </button>
                     ))}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                     {filteredMedicines.map(med => (
                        <Card key={med.id} className="flex items-center gap-4">
                            <Icon name={med.icon} className="w-8 h-8 text-primary flex-shrink-0" />
                            <div className="flex-grow">
                                <h4 className="font-semibold">{med.name}</h4>
                                <p className="text-gray-600">₹{med.price.toFixed(2)}</p>
                            </div>
                            <button onClick={() => addToCart(med)} className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg text-sm">{t('addToCart')}</button>
                        </Card>
                     ))}
                 </div>
            </div>
            <div className="space-y-4">
                <Card>
                    <h3 className="text-xl font-bold mb-4">{t('yourCart')}</h3>
                    {cart.length === 0 ? (<p className="text-gray-500">{t('emptyCart')}</p>) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <p>{item.name} x {item.quantity}</p>
                                    <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    <hr className="my-4"/>
                    <div className="flex justify-between font-bold text-lg">
                        <p>{t('total')}</p>
                        <p>₹{cartTotal.toFixed(2)}</p>
                    </div>
                    <button disabled={cart.length === 0} onClick={() => handleProceedToDelivery()} className="w-full mt-4 bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark disabled:bg-gray-400">{t('checkout')}</button>
                </Card>
            </div>
        </div>
      </div>
    );
  }

  if (step === 'delivery') {
      return (
        <div className="max-w-lg mx-auto">
            <button onClick={() => setStep('medicines')} className="text-primary font-semibold mb-4">&larr; Back to Medicines</button>
            <Card>
                <h2 className="text-2xl font-bold text-dark mb-6">{t('deliveryDetails')}</h2>
                <form onSubmit={handleDeliveryFormSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">{t('deliveryAddress')}</label>
                        <textarea
                            id="address"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className={getInputClass('deliveryAddress')}
                            rows={3}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">{t('deliveryDate')}</label>
                            <input
                                type="date"
                                id="date"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                                className={getInputClass('deliveryDate')}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700">{t('deliveryTime')}</label>
                            <input
                                type="time"
                                id="time"
                                value={deliveryTime}
                                onChange={(e) => setDeliveryTime(e.target.value)}
                                className={getInputClass('deliveryTime')}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors">
                        {t('confirmAndPlaceOrder')}
                    </button>
                </form>
            </Card>
        </div>
      )
  }

  if (step === 'checkout') {
      return (
          <div className="max-w-lg mx-auto text-center">
             <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             <h2 className="text-3xl font-bold text-dark mb-4">Order Placed!</h2>
             <p className="text-gray-500 mb-6">Your order will be delivered soon from {selectedHospital?.name}.</p>
             <div className="space-y-4">
                <Card>
                    <h3 className="font-bold text-lg border-b pb-2 mb-4">Order Summary</h3>
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm mb-2">
                            <p>{item.name} x {item.quantity}</p>
                            <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                    <hr className="my-4"/>
                    <div className="flex justify-between font-bold text-lg">
                        <p>{t('total')}</p>
                        <p>₹{cartTotal.toFixed(2)}</p>
                    </div>
                </Card>
                <Card className="text-left">
                    <h3 className="font-bold text-lg border-b pb-2 mb-4">{t('deliveryDetails')}</h3>
                    <p className="font-semibold">{deliveryAddress}</p>
                    <p className="text-gray-600">{deliveryDate} @ {deliveryTime}</p>
                </Card>
             </div>
             <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => changePage('order-history')} className="bg-secondary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                    View Order History
                </button>
                <button onClick={() => { setStep('hospital'); setCart([]); }} className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors">
                    Place Another Order
                </button>
             </div>
          </div>
      )
  }

  return null;
};

export default OrderMedicine;