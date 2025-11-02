import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { useTranslations } from '../hooks/useTranslations';
import { useApp } from '../hooks/useApp';

const Settings: React.FC = () => {
    const t = useTranslations();
    const { user, setUser, voiceAction, setVoiceAction } = useApp();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [showSuccess, setShowSuccess] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(user?.name || '');
        setEmail(user?.email || '');
    }, [user]);
    
    useEffect(() => {
        if (voiceAction === 'edit_profile') {
            nameInputRef.current?.focus();
            setVoiceAction(null);
        }
    }, [voiceAction, setVoiceAction]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {
            setUser({ ...user, name, email });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-dark mb-6">{t('profile')} & {t('settings')}</h1>
            
            <Card>
                <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl font-bold text-primary">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold">{user?.name}</h2>
                        <p className="text-gray-500">{user?.email}</p>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">{t('editProfile')}</h2>
                {showSuccess && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{t('profileUpdated')}</div>}
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('name')}</label>
                        <input ref={nameInputRef} type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('email')}</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors">{t('saveChanges')}</button>
                    </div>
                </form>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
                <div className="flex items-center justify-between">
                    <p>Email Notifications</p>
                    <label className="switch">
                        <input type="checkbox" defaultChecked />
                        <span className="slider round"></span>
                    </label>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <p>Push Notifications</p>
                    <label className="switch">
                        <input type="checkbox" />
                        <span className="slider round"></span>
                    </label>
                </div>
            </Card>
             <style>{`
                .switch { position: relative; display: inline-block; width: 60px; height: 34px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; }
                .slider:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; }
                input:checked + .slider { background-color: #00C4B4; }
                input:checked + .slider:before { transform: translateX(26px); }
                .slider.round { border-radius: 34px; }
                .slider.round:before { border-radius: 50%; }
            `}</style>
        </div>
    );
};

export default Settings;