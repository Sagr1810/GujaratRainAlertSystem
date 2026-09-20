import React, { useState } from 'react';
import { T, EMERGENCY_CONTACTS } from '../utils/constants';

const sec = (title, children) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden', marginBottom: 14 }}>
    <div style={{ background: T.surface2, borderBottom: `1px solid ${T.border}`, padding: '12px 16px', fontWeight: 700, color: T.text, fontSize: 14 }}>{title}</div>
    <div style={{ padding: '14px 16px' }}>{children}</div>
  </div>
);

const CROPS = {
  groundnut: { icon:'🥜', region:'Saurashtra, North Gujarat', normal:'✅ Ideal sowing. Ensure well-drained soil.', yellow:'⚠️ Moderate rain beneficial. Monitor for stem rot.', orange:'🟠 Avoid sowing. Risk of pod rot.', red:'🔴 Risk of crop damage. Drain fields urgently.', dark_red:'🚨 Harvest mature groundnut immediately.' },
  cotton:    { icon:'🌿', region:'North & Central Gujarat', normal:'✅ Normal conditions. Regular irrigation.', yellow:'⚠️ Beneficial rain. Monitor for bollworm.', orange:'🟠 Risk of flower shedding and boll rot.', red:'🔴 Do not spray pesticides. Drain waterlogged fields.', dark_red:'🚨 Severe crop loss likely.' },
  sugarcane: { icon:'🎋', region:'South Gujarat (Surat, Bharuch)', normal:'✅ Regular fertilization recommended.', yellow:'⚠️ Moderate rain good for ratoon crop.', orange:'🟠 Tie bundles. Risk of lodging.', red:'🔴 Root rot risk from waterlogging.', dark_red:'🚨 Call insurance: 1800-209-5959.' },
  wheat:     { icon:'🌾', region:'North Gujarat (Rabi, Nov–Dec)', normal:'✅ Wheat sowing window active.', yellow:'⚠️ Light rain beneficial.', orange:'🟠 Not applicable for kharif.', red:'🔴 Excess moisture risk.', dark_red:'🚨 Contact KVK immediately.' },
  vegetables:{ icon:'🥦', region:'Anand, Kheda', normal:'✅ Good growing conditions.', yellow:'⚠️ Spray preventive fungicide.', orange:'🟠 Stop irrigation. Fungal disease risk.', red:'🔴 Cover crops. High loss risk.', dark_red:'🚨 File insurance claim.' },
};

const DISEASES = [
  ['🦠 Leptospirosis','High','2–14 days','Fever, muscle pain, jaundice','Avoid wading in floodwater. Wear waterproof boots.'],
  ['🦟 Malaria','High','7–30 days','Fever, chills, sweating','Use mosquito nets. Eliminate standing water.'],
  ['🦟 Dengue','Medium','4–7 days','High fever, rash, joint pain','Remove water containers. Use repellents.'],
  ['🦠 Cholera','High','2h–5 days','Severe diarrhea, vomiting','Drink only boiled water. Wash hands frequently.'],
  ['🦠 Typhoid','Medium','6–30 days','Sustained fever, weakness','Avoid contaminated food/water.'],
  ['🩹 Fungal Infections','High','Immediate','Itching, rash','Keep skin dry. Change wet clothes promptly.'],
];

const EVAC = [
  ['Vadodara Low-Lying Areas','Very High','Evacuate when Vishwamitri crosses 14.5m. Assembly: Mandvi Ground, Rajmahal Road.'],
  ['Surat Coastal Zones','High','Evacuate when Tapi at danger level. Shelters: SMC Schools on NH-48.'],
  ['Kutch Coastal Villages','Very High','Pre-emptive evacuation for cyclone. District Emergency: 02832-251000.'],
  ['Banaskantha River Beds','High','Evacuate Banas/Rupen river beds during Red Alert.'],
  ['Rajkot Bhadar Basin','High','Evacuate within 500m of Bhadar river. Move to elevated NH.'],
];

const KIT = ['💧 Water (3L/person/day)','🍱 Food (3-day supply)','💊 Medicines','📄 Documents','🔦 Flashlight','📱 Powerbank','🧴 First Aid Kit','👕 Change of clothes','💰 Cash','🗺️ Physical map','👶 Baby/pet supplies','🔑 Car keys'];

export default function Features() {
  const [tab, setTab] = useState('farmer');
  const [crop, setCrop] = useState('groundnut');
  const [alertSim, setAlertSim] = useState('normal');

  const TABS = [['farmer','🌾 Farmer Advisory'],['disease','🏥 Health Risk'],['evacuation','🚗 Evacuation'],['emergency','🚨 Emergency'],['tips','💡 Safety Tips'],['economic','📈 Economic Impact']];

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 800 }}>🛡️ Advanced Features</h1>
        <p style={{ color: T.textMute, fontSize: 13 }}>Comprehensive tools beyond standard weather apps</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map(([k,l]) => <button key={k} onClick={() => setTab(k)} style={{ background:'transparent', color: tab===k?'#2563eb':T.textMute, border:'none', borderBottom: tab===k?'2px solid #2563eb':'2px solid transparent', padding:'8px 14px', fontSize:13, fontWeight: tab===k?700:500, marginBottom:-2 }}>{l}</button>)}
      </div>

      {tab === 'farmer' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {Object.keys(CROPS).map(c => <button key={c} onClick={() => setCrop(c)} style={{ background: crop===c?'#f0fdf4':T.surface, color: crop===c?'#16a34a':T.textMid, border: `1px solid ${crop===c?'#86efac':T.border}`, borderRadius: 20, padding:'5px 14px', fontSize:12, fontWeight:600 }}>{CROPS[c].icon} {c.charAt(0).toUpperCase()+c.slice(1)}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: T.textMute, fontSize: 12 }}>Simulate Alert:</span>
            {['normal','yellow','orange','red','dark_red'].map(l => <button key={l} onClick={()=>setAlertSim(l)} style={{ background: alertSim===l?'#2563eb':T.surface, color: alertSim===l?'#fff':T.textMid, border:`1px solid ${alertSim===l?'#2563eb':T.border}`, borderRadius:20, padding:'4px 12px', fontSize:11, fontWeight:600 }}>{l.replace('_',' ')}</button>)}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: T.shadow }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{CROPS[crop].icon}</div>
            <h2 style={{ color: T.text, marginBottom: 4 }}>{crop.charAt(0).toUpperCase()+crop.slice(1)} Advisory</h2>
            <div style={{ color: '#2563eb', fontSize: 12, marginBottom: 12 }}>📍 {CROPS[crop].region}</div>
            <div style={{ background: T.surface2, borderRadius: 10, padding: 16, fontSize: 15, color: T.text, lineHeight: 1.7, border: `1px solid ${T.border}` }}>{CROPS[crop][alertSim]}</div>
            <div style={{ marginTop: 12, color: T.textMute, fontSize: 12 }}>📞 Krishi Vigyan Kendra: <span style={{ color: '#16a34a', fontWeight: 700 }}>1800-180-1551</span> (Free)</div>
          </div>
        </div>
      )}

      {tab === 'disease' && (
        <div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#92400e', fontSize: 13 }}>⚠️ Post-flood disease outbreaks occur 3–15 days after floodwater recedes. Take preventive action immediately.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 12 }}>
            {DISEASES.map(([d,risk,onset,symp,prev]) => (
              <div key={d} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16, boxShadow: T.shadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: T.text, fontWeight: 700 }}>{d}</span>
                  <span style={{ background: risk==='High'?'#fef2f2':'#fffbeb', color: risk==='High'?'#dc2626':'#d97706', border: `1px solid ${risk==='High'?'#fecaca':'#fde68a'}`, borderRadius: 20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>{risk}</span>
                </div>
                <div style={{ color: T.textMute, fontSize: 12, marginBottom: 4 }}>⏱️ Onset: {onset}</div>
                <div style={{ color: '#d97706', fontSize: 12, marginBottom: 8 }}>🤒 {symp}</div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '7px 10px', color: '#166534', fontSize: 12 }}>🛡️ {prev}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'evacuation' && (
        <div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>🚨 If you receive an evacuation order — LEAVE IMMEDIATELY. Take documents, medicines, water.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 12, marginBottom: 16 }}>
            {EVAC.map(([area,risk,instr]) => (
              <div key={area} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${risk==='Very High'?'#fecaca':T.border}`, padding: 16, boxShadow: T.shadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: T.text, fontWeight: 700 }}>📍 {area}</span>
                  <span style={{ background: risk==='Very High'?'#fef2f2':'#fff7ed', color: risk==='Very High'?'#dc2626':'#ea580c', border:`1px solid ${risk==='Very High'?'#fecaca':'#fed7aa'}`, borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{risk}</span>
                </div>
                <div style={{ color: T.textMid, fontSize: 13, lineHeight: 1.6 }}>{instr}</div>
              </div>
            ))}
          </div>
          {sec('📦 Emergency Kit Checklist', <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>{KIT.map(i => <div key={i} style={{ background: T.surface2, borderRadius: 8, padding: '7px 10px', color: T.textMid, fontSize: 13, border: `1px solid ${T.border}` }}>{i}</div>)}</div>)}
        </div>
      )}

      {tab === 'emergency' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
          {EMERGENCY_CONTACTS.map(c => (
            <div key={c.name} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, textAlign: 'center', boxShadow: T.shadow }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ color: T.text, fontWeight: 700, marginBottom: 8 }}>{c.name}</div>
              <a href={`tel:${c.number}`} style={{ color: '#16a34a', fontSize: 22, fontWeight: 800, display: 'block', letterSpacing: 1 }}>{c.number}</a>
              <div style={{ color: T.textMute, fontSize: 11, marginTop: 4 }}>Tap to call</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'tips' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 14 }}>
          {[['🌧️ During Heavy Rain',['Stay indoors. Away from windows.','Do not drive through flooded roads.','Keep away from rivers and drains.','Charge all electronic devices.','Monitor IMD alerts.']],['🌊 If Flooding Occurs',['Move to higher ground immediately.','Do not touch electrical switches if wet.','Turn off gas and electricity at mains.','Evacuate if ordered — take emergency kit.','Do not drink tap water.','Call 112 for emergencies.']],['🏠 After Floods',['Do not return until authorities say safe.','Document all damage for insurance.','Boil water before drinking for 2 weeks.','Clean and disinfect surfaces.','Watch for fever, diarrhea (disease signs).']],['🚗 Vehicle Safety',['Never drive through flooded roads.','15cm water can knock you off your feet.','30cm can sweep a small car away.','If car stalls in water, exit immediately.']]].map(([title,tips]) => (
            <div key={title} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18, boxShadow: T.shadow }}>
              <h3 style={{ color: T.text, marginBottom: 12, fontSize: 15 }}>{title}</h3>
              <ul style={{ paddingLeft: 18 }}>{tips.map(t => <li key={t} style={{ color: T.textMid, fontSize: 13, marginBottom: 6 }}>{t}</li>)}</ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'economic' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 12 }}>
          {[['🌾 Agriculture','Major crop loss in groundnut, cotton, sugarcane. Avg ₹2,000–8,000 Cr/year.','Small farmers, laborers','PM Fasal Bima Yojana, State Relief'],['💎 Diamond Industry (Surat)','1-week shutdown = ₹2,000+ Cr loss. 7 lakh workers affected.','Workers, exporters','Industry insurance, GJEPC'],['🏭 Industrial (GIDC)','Chemical/pharmaceutical losses in Ankleshwar, Vatva.','Industry, workers','GIDB assistance'],['🛣️ Infrastructure','Roads, bridges. ₹1,500–5,000 Cr/year damage.','Commuters, rural areas','NDRF grants'],['🏠 Housing','50,000–2,00,000 houses affected annually.','Rural poor, tribal communities','PMAY, Indira Awaas Yojana'],['🐄 Livestock','Cattle, poultry, fisheries. ₹200–800 Cr/year.','Pastoral communities','Animal insurance, NABARD']].map(([s,i,a,r]) => (
            <div key={s} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16, boxShadow: T.shadow }}>
              <h3 style={{ color: T.text, marginBottom: 8, fontSize: 14 }}>{s}</h3>
              <div style={{ color: T.textMid, fontSize: 13, marginBottom: 8 }}>{i}</div>
              <div style={{ color: '#ea580c', fontSize: 12, marginBottom: 6 }}>👥 {a}</div>
              <div style={{ color: '#16a34a', fontSize: 12 }}>🔄 {r}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
