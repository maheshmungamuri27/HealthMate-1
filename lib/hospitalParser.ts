import type { Hospital } from '../types';

// This is the new, user-provided hospital data.
export const hospitalRawData = `
East Godavari
Government General Hospital, Rajahmundry
Rajahmundry, East Godavari, Andhra Pradesh – 533101

Apollo Banjara Hills Hospitals, Kakinada Branch
Kakinada, East Godavari, Andhra Pradesh

AIG Hospitals
Kakinada, East Godavari, Andhra Pradesh

Devatha Hospital
Rajahmundry, East Godavari, Andhra Pradesh

Sri Sai Hospitals
Rajahmundry, East Godavari

Care Hospital
Kakinada, East Godavari

Srikara Hospitals
Rajahmundry, East Godavari

Tulasi Hospitals
Rajahmundry, East Godavari

Sri Raghavendra Multispeciality Hospital
Rajahmundry, East Godavari

Noel Hospital
Kakinada, East Godavari

Nellore (Sri Potti Sriramulu Nellore)
Government General Hospital
Nellore, Andhra Pradesh – 524001

Sunrise Hospitals
Nellore, Andhra Pradesh

KIMS Hospitals
Nellore

Nellore Diagnostic & Multispeciality Centre
Nellore

Vinayaka Speciality Hospitals
Nellore

Appollo Hospitals
Nellore

NRI Hospital
Nellore

Narayana Multispeciality Hospital
Nellore

Ashwini Hospitals
Nellore

Sai Anjaneya Hospital
Nellore

Prakasam
Government General Hospital
Ongole, Prakasam, Andhra Pradesh – 523001

Ramesh Hospitals
Ongole

Nagarjuna Hospital
Ongole

Vijay Super Speciality Hospital
Ongole

Sreshta Hospital
Ongole

Sanjeevani Hospital
Ongole

Sai Sankara Hospital
Ongole

Sobha Hospitals
Ongole

Amaravathi Hospital
Ongole

Narayana Hospitals
Ongole

Chittoor
Government General Hospital
Chittoor, Andhra Pradesh – 517001

Government Maternity Hospital
Chittoor

Chandra Mohan Nursing Home
Chittoor

Surya Hospitals
Chittoor

Sri Venkateswara Hospitals
Chittoor

Annamayya Hospital
Chittoor

Prakash Hospital
Chittoor

Medi Clinic Hospital
Chittoor

Shanmukha Hospitals
Chittoor

Raghavendra Hospital
Chittoor

Kurnool
Government General Hospital
Kurnool, Andhra Pradesh – 518001

Vijaya Hospital
Kurnool

Sri Gayatri Hospital
Kurnool

Sai Hospital
Kurnool

LIFE Hospitals
Kurnool

NTR Hospital
Kurnool

Kamineni Hospital
Kurnool

Prasad Hospitals
Kurnool

Sri Krishna Hospital
Kurnool

Southern Care Hospital
Kurnool

Guntur
AIIMS Mangalagiri
MG Campus, Mangalagiri, Guntur District, Andhra Pradesh – 522503

Lalitha Super Speciality Hospital Pvt Ltd
Beside Hindu College Grounds, Collector Office Road, Guntur – 522004

Omega Hospitals
Near VMC Bus Stand, Guntur – 522002

Government General Hospital
Near Municipal Office, Guntur – 522001

GGH Guntur
Prakasam Nagar, Guntur – 522004

Santhiram Medical College & Hospital
Nandyal Road, Guntur – 522601

Narayana Multispeciality Hospital
Guntur – 522002

Katuri Medical College
Guntur – 522007

Visakha Eye Hospital (Nagari Road Branch)
Nagari Road, Guntur

Guntur Maternity Hospital
Guntur – 522002

Visakhapatnam
Apollo Hospitals
Waltair Main Rd, Opp Daspalla, Ram Nagar, Visakhapatnam – 530002

Gayatri Vidya Parishad Institute of Health Care and Medical Technology
Visakhapatnam – 530040

Omega Hospitals
D.no 50-81-1/17, Ramnagar, Visakhapatnam – 530002

Pinnacle Hospitals
Gurudwara Junction, Seethammadhara Road, Visakhapatnam – 530013

Visakha Eye Hospital
Dwaraka Nagar, Visakhapatnam – 530016

King George Hospital
Vizianagaram Road, Visakhapatnam

ESIC Model Hospital
Visakhapatnam – 530014

L.V. Prasad Eye Institute
Visakhapatnam

PES Institute of Medical Sciences & Research
Mangalagiri, Visakhapatnam

Government General Hospital
Visakhapatnam

Tirupati
Sri Venkateswara Institute of Medical Sciences (SVIMS)
Alipiri Road, Tirupati – 517507

Amara Hospital
Korramenugunta, Tirupati – 517501

Sri Venkateswara Ramnarain Ruia Government General Hospital
Tirupati – 517501

Sri Padmavathi Medical College and Hospital
Tirupati

Apollo Hospitals Tirupati
Tirupati

Rainbow Children's Hospital
Tirupati – 517501

Sri Venkateswara Dental College & Hospital
Tirupati

Sri Venkateswara Institute of Medical Sciences – Karakambadi
Tirupati

Government Maternity Hospital
Tirupati

KIMS Hospitals Tirupati
Tirupati

Kakinada
Trinity Hospital
D.No. 11-1-13, Temple Street, Kakinada – 533001

AIG Hospitals
Kakinada

Government General Hospital
Kakinada

Vijaya Hospitals
Kakinada

Care Hospitals
Kakinada

Krishna Hospital
Kakinada

Prolife Hospital
Kakinada

Gayatri Hospitals
Kakinada

Einstein Hospital
Kakinada

Bhavan's Narayana Hospital
Kakinada

Krishna District (Vijayawada)
Kanuru Top Star Hospitals
Bandar Road, Kanuru, Vijayawada

Dr Ramesh Cardiac and Multispeciality Hospital Pvt Ltd
Vijayawada

Srikara Hospitals
Vijayawada

Government General Hospital
Vijayawada

L.V. Prasad Eye Institute
Vijayawada

Apollo Hospitals
Vijayawada

Care Hospitals
Vijayawada

Krishna Institute of Medical Sciences
Vijayawada

Rainbow Hospitals
Vijayawada

King's Hospital
Vijayawada
`;

const DISTRICT_NAMES = [
    "EAST GODAVARI", "NELLORE", "PRAKASAM", "CHITTOOR", "KURNOOL",
    "GUNTUR", "VISAKHAPATNAM", "TIRUPATI", "KAKINADA", "KRISHNA DISTRICT"
];

// A new robust parser designed for the user-provided data structure.
export const parseHospitalData = (): Hospital[] => {
    const hospitals: Hospital[] = [];
    const lines = hospitalRawData.trim().split('\n').filter(line => line.trim() !== '');

    let currentDistrict = "Unknown";
    let idCounter = 1;
    
    const isDistrictLine = (line: string): boolean => {
        if (!line) return false;
        const cleanedLine = line.toUpperCase().split('(')[0].trim();
        return DISTRICT_NAMES.includes(cleanedLine);
    };

    for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        
        if (isDistrictLine(trimmedLine)) {
            let districtName = trimmedLine.split('(')[0].trim();
            // Title case the district name for consistency
            districtName = districtName
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            if (districtName === "Krishna District") {
                districtName = "Krishna";
            }
            currentDistrict = districtName;
            continue;
        }

        const hospitalName = trimmedLine;
        
        let hospitalAddress: string;
        // Check if the next line exists and is NOT a district line or empty.
        if (i + 1 < lines.length && lines[i + 1].trim() && !isDistrictLine(lines[i + 1].trim())) {
             hospitalAddress = lines[i + 1].trim();
             i++; // Consume the address line
        } else {
            // If no specific address is found, use the district name. It's more helpful than "not available".
            hospitalAddress = currentDistrict;
        }
        
        hospitals.push({
            id: idCounter++,
            name: hospitalName,
            address: hospitalAddress,
            district: currentDistrict,
            logo: '',
            specializations: ['General Medicine', 'General Surgery', 'Cardiology', 'OBG', 'Pediatrics', 'Orthopedics'], 
        });
    }

    return hospitals;
};


let uniqueDistricts: string[] = [];

export const getUniqueDistricts = (): string[] => {
    if (uniqueDistricts.length === 0) {
        const hospitals = parseHospitalData();
        const districts = new Set(hospitals.map(h => h.district));
        uniqueDistricts = Array.from(districts).sort();
    }
    return uniqueDistricts;
};
