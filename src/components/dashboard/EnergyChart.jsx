import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const METRICS = [
  { id: 'kw', label: 'Daya', unit: 'kW', color: '#f97316' },
  { id: 'voltage', label: 'Tegangan', unit: 'V', color: '#3b82f6' },
  { id: 'amp', label: 'Arus', unit: 'A', color: '#c87941' },
  { id: 'hz', label: 'Frekuensi', unit: 'Hz', color: '#2a9d8f' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d1f38', border: '1px solid #243f68', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
          {p.name}: {p.value} {p.unit}
        </div>
      ))}
    </div>
  );
};

export default function EnergyChart({ data, title = 'Tren Realtime', initialMetric = 'kw' }) {
  const [selectedId, setSelectedId] = useState(initialMetric);
  const [isOpen, setIsOpen] = useState(false);
  const activeMetric = METRICS.find(m => m.id === selectedId) || METRICS[0];
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
          {title} ({activeMetric.label})
        </div>
        
        {/* Menu Pilihan Grafik (Dropdown) */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 10, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
              background: `${activeMetric.color}15`,
              color: activeMetric.color,
              border: `1px solid ${activeMetric.color}50`,
              cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
            }}
          >
            {activeMetric.label}
            <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>

          {isOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              background: '#0d1f38', border: '1px solid #243f68',
              borderRadius: 10, padding: 6, zIndex: 50,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              minWidth: 140, display: 'flex', flexDirection: 'column', gap: 4
            }}>
              {METRICS.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedId(m.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 11, fontWeight: 600, padding: '8px 12px', borderRadius: 6,
                    background: selectedId === m.id ? `${m.color}15` : 'transparent',
                    color: selectedId === m.id ? m.color : '#94a3b8',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (selectedId !== m.id) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = '#e2e8f0';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedId !== m.id) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  {m.label}
                  {selectedId === m.id && <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, boxShadow: `0 0 6px ${m.color}` }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id={`colorMetric-${activeMetric.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.5}/>
              <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a3558" />
          <XAxis
            dataKey="time" tick={{ fill: '#475569', fontSize: 9 }}
            interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: '#1a3558' }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey={activeMetric.id} stroke={activeMetric.color} strokeWidth={2}
            fillOpacity={1} fill={`url(#colorMetric-${activeMetric.id})`}
            dot={false} activeDot={{ r: 4, fill: activeMetric.color }}
            name={activeMetric.label} unit={` ${activeMetric.unit}`}
            style={{ filter: `drop-shadow(0 0 2px ${activeMetric.color}80)` }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
