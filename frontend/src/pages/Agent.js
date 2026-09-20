import React, { useState, useRef, useEffect } from 'react';
import { agentAPI } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { T } from '../utils/constants';

const QUICK = [
  { icon:'🌧️', text:"What is today's rain status in Gujarat?" },
  { icon:'⚠️', text:'What are the current flood warnings?' },
  { icon:'🌾', text:'Farmer advisory for kharif crop season' },
  { icon:'🏥', text:'Disease risk after heavy rain in Gujarat' },
  { icon:'💧', text:'Sardar Sarovar dam current water level' },
  { icon:'📊', text:'Summarize Gujarat flood history 2021-2024' },
  { icon:'🚨', text:'Emergency evacuation guidance for Surat' },
  { icon:'🌀', text:'Impact of Cyclone Biparjoy on Gujarat 2023' },
];

const Bubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14, gap: 8 }}>
      {!isUser && <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🤖</div>}
      <div style={{ maxWidth: '75%' }}>
        <div style={{
          background: isUser ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : T.surface,
          color: isUser ? '#fff' : T.text,
          borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
          padding: '10px 14px', fontSize: 14, lineHeight: 1.7,
          border: isUser ? 'none' : `1px solid ${T.border}`,
          boxShadow: isUser ? 'none' : T.shadow,
          whiteSpace: 'pre-wrap',
        }}>{msg.content}</div>
        <div style={{ color: T.textMute, fontSize: 11, marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {msg.time}
          {msg.source === 'granite' && <span style={{ color: '#7c3aed', marginLeft: 8 }}>⚡ IBM Granite LLM</span>}
          {msg.source === 'fallback' && <span style={{ color: '#16a34a', marginLeft: 8 }}>💡 Built-in AI</span>}
          {msg.source === 'imd_openmeteo' && <span style={{ color: '#2563eb', marginLeft: 8 }}>📡 IMD Live</span>}
        </div>
      </div>
      {isUser && <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, border: '1px solid #bfdbfe' }}>👤</div>}
    </div>
  );
};

export default function Agent() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `👋 **Welcome to GujaratRainBot!**\n\nI'm your AI assistant powered by IBM Granite LLM, specialized in Gujarat weather, floods, and disaster management.\n\n**Ask me anything about:**\n🌧️ Live rainfall & IMD alerts\n⚠️ Flood warnings & safety advice\n🌾 Farmer crop advisories\n📊 Historical flood data (2021–2024)\n💧 Dam & reservoir levels\n🏥 Post-flood health risks\n🗺️ Evacuation guidance\n\n**Supports: English · Hindi · Gujarati**\n\n🚨 Emergency: Call 112`,
    time: format(new Date(), 'HH:mm'),
    source: 'system',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, time: format(new Date(), 'HH:mm') }]);
    setLoading(true);
    try {
      const res = await agentAPI.chat({ message: msg, session_id: sessionId });
      const text = res.data?.response || 'I could not generate a response. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: text, time: format(new Date(), 'HH:mm'), source: res.data?.source }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🔌 **Server not reachable.**\n\nPlease run \`start.bat\` to start the backend, then refresh.\n\n**Quick emergency info:**\n🚨 Emergency: 112\n🏥 Ambulance: 108\n🌊 Flood Control: 1077\n🌾 Krishi Helpline: 1800-180-1551`,
        time: format(new Date(), 'HH:mm'),
        source: 'offline',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 88px)', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: T.shadow }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🤖</div>
        <div>
          <div style={{ color: T.text, fontWeight: 800, fontSize: 16 }}>GujaratRainBot — AI Assistant</div>
          <div style={{ color: T.textMute, fontSize: 12 }}>Powered by IBM Granite LLM · Gujarat Weather Intelligence</div>
        </div>
        <div style={{ marginLeft: 'auto', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 20, padding: '4px 12px', color: '#7c3aed', fontSize: 12, fontWeight: 600 }}>⚡ IBM watsonx.ai</div>
      </div>

      {/* Quick prompts */}
      <div style={{ background: T.surface2, borderBottom: `1px solid ${T.border}`, padding: '10px 24px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          {QUICK.map(p => (
            <button key={p.text} onClick={() => send(p.text)} style={{ background: T.surface, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {p.icon} {p.text.substring(0, 28)}…
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: T.bg }}>
        {messages.map((m, i) => <Bubble key={i} msg={m} />)}
        {loading && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '4px 18px 18px 18px', padding: '12px 18px', boxShadow: T.shadow }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', animation: 'bounce 1.2s infinite', animationDelay: `${i*0.2}s` }} />)}
                <span style={{ color: T.textMute, fontSize: 12, marginLeft: 8 }}>IBM Granite LLM processing…</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: '14px 24px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about Gujarat rain, floods, farmer advisory, evacuation… (Enter to send)"
            rows={2}
            style={{ flex: 1, background: T.surface2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ background: loading || !input.trim() ? '#e2e8f0' : 'linear-gradient(135deg,#2563eb,#7c3aed)', color: loading || !input.trim() ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, padding: '0 20px', fontSize: 20, minWidth: 52, transition: 'all 0.15s' }}>
            {loading ? '⏳' : '➤'}
          </button>
        </div>
        <div style={{ color: T.textMute, fontSize: 11, marginTop: 6, textAlign: 'center' }}>
          Powered by IBM Granite LLM via watsonx.ai · IMD Live Data · Session {sessionId.substring(0, 8)}…
        </div>
      </div>
    </div>
  );
}
