/**
 * Fallback department data that mirrors the seed data in db.js.
 * Used when the API is unreachable (e.g. static hosting, network error).
 * Each department includes its doctors so the full booking form works.
 */
export const FALLBACK_DEPARTMENTS = [
  {
    id: 1,
    code: 'GEN',
    name: 'General Medicine',
    nameMr: 'सामान्य औषधोपचार',
    nameHi: 'सामान्य चिकित्सा',
    description: 'Fever, infections, routine checks and common illnesses',
    color: '#0f766e',
    avgMinutes: 10,
    doctors: [
      { id: 2, name: 'Dr. Rohan Patil', qualification: 'MBBS, MD (Medicine)', room: 'Room 101', avgMinutes: 10, waiting: 0, paused: false, nextEtaMinutes: null, currentToken: null },
      { id: 6, name: 'Dr. Sneha Kulkarni', qualification: 'MBBS, MD (Medicine)', room: 'Room 102', avgMinutes: 11, waiting: 0, paused: false, nextEtaMinutes: null, currentToken: null }
    ]
  },
  {
    id: 2,
    code: 'CAR',
    name: 'Cardiology',
    nameMr: 'हृदयरोग विभाग',
    nameHi: 'हृदय रोग विभाग',
    description: 'Heart health, ECG, blood pressure and cardiac care',
    color: '#e11d48',
    avgMinutes: 15,
    doctors: [
      { id: 1, name: 'Dr. Anjali Deshmukh', qualification: 'MD, DM (Cardiology)', room: 'Room 204', avgMinutes: 15, waiting: 0, paused: false, nextEtaMinutes: null, currentToken: null },
      { id: 7, name: 'Dr. Arvind Rao', qualification: 'MD, DM (Cardiology)', room: 'Room 206', avgMinutes: 14, waiting: 0, paused: false, nextEtaMinutes: null, currentToken: null }
    ]
  },
  {
    id: 3,
    code: 'PED',
    name: 'Pediatrics',
    nameMr: 'बालरोग विभाग',
    nameHi: 'बाल रोग विभाग',
    description: 'Newborn, child health and vaccination services',
    color: '#2563eb',
    avgMinutes: 12,
    doctors: [
      { id: 3, name: 'Dr. Meera Joshi', qualification: 'MBBS, DCH', room: 'Room 108', avgMinutes: 12, waiting: 0, paused: false, nextEtaMinutes: null, currentToken: null },
      { id: 8, name: 'Dr. Nikhil Deshpande', qualification: 'MBBS, DCH', room: 'Room 109', avgMinutes: 12, waiting: 0, paused: false, nextEtaMinutes: null, currentToken: null }
    ]
  },
  {
    id: 4,
    code: 'OBG',
    name: 'Obstetrics & Gynaecology',
    nameMr: 'स्त्रीरोग व प्रसूती',
    nameHi: 'स्त्री रोग एवं प्रसूति',
    description: "Women's health, pregnancy and postnatal care",
    color: '#a21caf',
    avgMinutes: 16,
    doctors: [
      { id: 5, name: 'Dr. Kavita Pawar', qualification: 'MS (OBG)', room: 'Room 205', avgMinutes: 16, waiting: 0, paused: false, nextEtaMinutes: null, currentToken: null },
      { id: 9, name: 'Dr. Shalini Naik', qualification: 'MS (OBG)', room: 'Room 207', avgMinutes: 15, waiting: 0, paused: false, nextEtaMinutes: null, currentToken: null }
    ]
  },
  {
    id: 5,
    code: 'ORT',
    name: 'Orthopaedics',
    nameMr: 'अस्थिरोग विभाग',
    nameHi: 'हड्डी रोग विभाग',
    description: 'Bones, joints, fractures and mobility care',
    color: '#ea580c',
    avgMinutes: 14,
    doctors: [
      { id: 4, name: 'Dr. Sunil Kulkarni', qualification: 'MS (Orthopaedics)', room: 'Room 302', avgMinutes: 14, waiting: 0, paused: false, nextEtaMinutes: null, currentToken: null },
      { id: 10, name: 'Dr. Ajay Chavan', qualification: 'MS (Orthopaedics)', room: 'Room 304', avgMinutes: 13, waiting: 0, paused: false, nextEtaMinutes: null, currentToken: null }
    ]
  }
];
