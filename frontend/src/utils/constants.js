// ── Light Theme Design Tokens ──
export const T = {
  bg:       '#f0f4f8',
  surface:  '#ffffff',
  surface2: '#f8fafc',
  border:   '#e2e8f0',
  border2:  '#cbd5e1',
  text:     '#1a202c',
  textMid:  '#4a5568',
  textMute: '#718096',
  blue:     '#2563eb',
  blueLight:'#eff6ff',
  shadow:   '0 1px 4px rgba(0,0,0,0.08)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.1)',
};

export const ALERT_COLORS = {
  normal:   { bg:'#16a34a', light:'#f0fdf4', border:'#bbf7d0', text:'#166534', label:'Normal',        icon:'🟢' },
  yellow:   { bg:'#d97706', light:'#fffbeb', border:'#fde68a', text:'#92400e', label:'Yellow Alert',  icon:'🟡' },
  orange:   { bg:'#ea580c', light:'#fff7ed', border:'#fed7aa', text:'#9a3412', label:'Orange Alert',  icon:'🟠' },
  red:      { bg:'#dc2626', light:'#fef2f2', border:'#fecaca', text:'#991b1b', label:'Red Alert',     icon:'🔴' },
  dark_red: { bg:'#7f1d1d', light:'#fff1f2', border:'#fecdd3', text:'#7f1d1d', label:'Extreme Alert', icon:'🚨' },
};

export const REGION_COLORS = {
  NORTH:      '#f59e0b',
  SOUTH:      '#10b981',
  EAST:       '#8b5cf6',
  WEST:       '#ef4444',
  CENTRAL:    '#3b82f6',
  SAURASHTRA: '#ec4899',
};

export const REGION_INFO = {
  NORTH:      { name:'North Gujarat',   emoji:'🏜️', description:'Ahmedabad, Gandhinagar, Mehsana, Patan, Banaskantha', risk:'Flash floods (Banaskantha), Urban flooding', rivers:['Sabarmati','Banas','Rupen'] },
  SOUTH:      { name:'South Gujarat',   emoji:'🌊', description:'Surat, Bharuch, Navsari, Valsad, Tapi',               risk:'High — Ukai dam, Tapi & Narmada flooding',  rivers:['Tapi','Narmada','Ambika'] },
  EAST:       { name:'East Gujarat',    emoji:'🏔️', description:'Vadodara, Anand, Dahod, Panchmahal',                  risk:'Vishwamitri flooding, Tribal flash floods',  rivers:['Vishwamitri','Mahi','Panam'] },
  WEST:       { name:'West Gujarat',    emoji:'🏝️', description:'Kutch (Bhuj), Porbandar, Dwarka',                     risk:'Cyclone-prone, Kutch flash floods',           rivers:['Rukmavati','Bhukhi'] },
  CENTRAL:    { name:'Central Gujarat', emoji:'🌾', description:'Anand, Kheda, Nadiad, Cambay',                        risk:'Mahi river flooding, Agricultural damage',    rivers:['Mahi','Vatrak'] },
  SAURASHTRA: { name:'Saurashtra',      emoji:'⛵', description:'Rajkot, Bhavnagar, Jamnagar, Junagadh',               risk:'Very High — Bhadar/Machhu, Cyclone track',   rivers:['Bhadar','Machhu','Shetrunji'] },
};

export const IMD_THRESHOLDS = [
  { level:'normal',   min:0,     max:35.4,   label:'Light/No Rain',        color:'#16a34a' },
  { level:'yellow',   min:35.5,  max:64.4,   label:'Moderate-Heavy Rain',  color:'#d97706' },
  { level:'orange',   min:64.5,  max:115.5,  label:'Heavy Rain',           color:'#ea580c' },
  { level:'red',      min:115.6, max:204.4,  label:'Very Heavy Rain',      color:'#dc2626' },
  { level:'dark_red', min:204.5, max:Infinity,label:'Extremely Heavy Rain',color:'#7f1d1d' },
];

export const EMERGENCY_CONTACTS = [
  { name:'National Emergency',    number:'112',          icon:'🚨' },
  { name:'Gujarat SDMA',          number:'1077',         icon:'🏛️' },
  { name:'NDRF Control',          number:'011-24363260', icon:'⚠️' },
  { name:'Fire Brigade',          number:'101',          icon:'🔥' },
  { name:'Ambulance',             number:'108',          icon:'🏥' },
  { name:'Police',                number:'100',          icon:'👮' },
  { name:'Krishi Helpline',       number:'1800-180-1551',icon:'🌾' },
  { name:'Gujarat Flood Control', number:'079-23251900', icon:'💧' },
];
