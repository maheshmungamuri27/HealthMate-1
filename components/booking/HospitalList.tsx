import React, { useState, useMemo, useEffect } from 'react';
import type { Hospital } from '../../types';
import Card from '../common/Card';
import { useTranslations } from '../hooks/useTranslations';
import { useApp } from '../hooks/useApp';
import { searchHospitalInformation } from '../../services/geminiService';
import { hospitalRawData, getUniqueDistricts } from '../../lib/hospitalParser';

interface HospitalListProps {
  hospitals: Hospital[];
  onSelectHospital: (hospital: Hospital) => void;
  onBack: () => void;
}

const districts = getUniqueDistricts();

const HospitalList: React.FC<HospitalListProps> = ({ hospitals, onSelectHospital, onBack }) => {
  const t = useTranslations();
  const { hospitalSearchQuery } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchResult, setAiSearchResult] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);

  useEffect(() => {
    setSearchTerm(hospitalSearchQuery);
  }, [hospitalSearchQuery]);

  const filteredHospitals = useMemo(() => {
    let results = hospitals;
    
    if (selectedDistrict !== 'All') {
        results = results.filter(h => h.district === selectedDistrict);
    }
    
    if (!searchTerm) {
      return results;
    }

    const lowercasedTerm = searchTerm.toLowerCase();
    return results.filter(hospital => 
        hospital.name.toLowerCase().includes(lowercasedTerm) ||
        hospital.district.toLowerCase().includes(lowercasedTerm) ||
        hospital.specializations.some(spec => spec.toLowerCase().includes(lowercasedTerm))
    );
  }, [searchTerm, hospitals, selectedDistrict]);
  
  const handleAiSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aiSearchQuery) return;
      setIsAiSearching(true);
      setAiSearchResult('');
      const result = await searchHospitalInformation(aiSearchQuery, hospitalRawData);
      setAiSearchResult(result);
      setIsAiSearching(false);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={onBack} className="text-primary font-semibold">&larr; Back</button>
      <h2 className="text-3xl font-bold text-dark">{t('bookAppointment')}</h2>
      
      <Card>
        <form onSubmit={handleAiSearch} className="flex flex-col sm:flex-row gap-2">
            <input 
                type="text"
                value={aiSearchQuery}
                onChange={(e) => setAiSearchQuery(e.target.value)}
                placeholder={t('askAIPlaceholder')}
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <button type="submit" className="bg-secondary text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors" disabled={isAiSearching}>
                {isAiSearching ? '...' : t('askAI')}
            </button>
        </form>
        {aiSearchResult && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <p className="font-semibold text-primary mb-2">AI Answer:</p>
                <p className="text-gray-700 whitespace-pre-wrap">{aiSearchResult}</p>
            </div>
        )}
      </Card>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
            <input
            type="text"
            placeholder={t('searchLocation')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
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
        {filteredHospitals.length > 0 ? filteredHospitals.map(hospital => (
          <Card key={`${hospital.id}-${hospital.name}`} className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl flex-shrink-0">
                {hospital.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-dark">{hospital.name}</h3>
                <p className="text-gray-500 text-sm">{hospital.address}</p>
              </div>
            </div>
            <button
              onClick={() => onSelectHospital(hospital)}
              className="w-full sm:w-auto bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0 mt-2 sm:mt-0"
            >
              {t('selectAndBook')}
            </button>
          </Card>
        )) : (
            <div className="text-center py-10">
                <p className="text-gray-500">No hospitals found matching your search.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default HospitalList;