import { useMemo } from 'react';
import { Gauge } from 'lucide-react';

const CX = 80, CY = 80;
const START = 140, SWEEP = 260;

function ptc(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return [+(cx + r * Math.cos(rad)).toFixed(2), +(cy + r * Math.sin(rad)).toFixed(2)];
}

function arcD(r, startDeg, endDeg, cx = CX, cy = CY) {
  const [sx, sy] = ptc(cx, cy, r, startDeg);
  const [ex, ey] = ptc(cx, cy, r, endDeg);
  const span  = ((endDeg - startDeg) + 360) % 360;
  const large = span > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
}

function getPressureColor(pressure, max) {
  const pct = pressure / max;
  if (pct < 0.2) return '#f87171';   // merah — rendah / bahaya
  if (pct < 0.5) return '#f59e0b';   // amber — waspada
  if (pct < 0.85) return '#10b981';  // hijau — normal
  return '#ef4444';                   // merah — overpressure
}

function getPressureStatus(pressure, max) {
  const pct = pressure / max;
  if (pct < 0.2) return { label: 'TEKANAN RENDAH', color: '#f87171' };
  if (pct < 0.5) return { label: 'WASPADA', color: '#f59e0b' };
  if (pct < 0.85) return { label: 'NORMAL', color: '#10b981' };
  return { label: 'OVERPRESSURE', color: '#ef4444' };
}

export default function PressureSensorCard({ 
  pressure = 0, 
  maxPressure = 10, 
  title = 'Sensor Tekanan Air',
  subtitle = 'Pressure Transducer • Bar',
  iconColor = '#3b82f6',
  icon: Icon = Gauge
}) {
  const pct = Math.max(0, Math.min(1, pressure / maxPressure));
  const pressColor = getPressureColor(pressure, maxPressure);
  const status = getPressureStatus(pressure, maxPressure);

  const valueEndDeg = START + pct * SWEEP;
  const [dotX, dotY] = ptc(CX, CY, 58, valueEndDeg);

  const ticks = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 30; i++) {
      const f = i / 30;
      const deg = START + f * SWEEP;
      const isMajor = i % 5 === 0;
      const [ox, oy] = ptc(CX, CY, 50, deg);
      const [ix, iy] = ptc(CX, CY, isMajor ? 43 : 47, deg);
      arr.push({ ox, oy, ix, iy, isMajor });
    }
    return arr;
  }, []);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px 8px',
        borderBottom: '1px solid rgba(26,53,88,0.6)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${iconColor}1a`, border: `1px solid ${iconColor}4d`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} color={iconColor} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {title}
          </div>
          <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>{subtitle}</div>
        </div>
        {/* Live badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981',
            boxShadow: '0 0 6px #10b981', animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 8, color: '#10b981', fontWeight: 700, letterSpacing: '0.05em' }}>LIVE</span>
        </div>
      </div>

      {/* Gauge Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, paddingBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <svg width="260" height="220" viewBox="-10 5 180 145" style={{ overflow: 'visible' }}>
            <defs>
              <filter id="ps-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="ps-glow-soft" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <radialGradient id="ps-bg-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0d1f38" />
                <stop offset="100%" stopColor="#040b16" />
              </radialGradient>
              <linearGradient id="ps-track-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={pressColor} stopOpacity="0.5" />
                <stop offset="100%" stopColor={pressColor} stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <path d={arcD(58, START, START + SWEEP)} fill="none"
              stroke="#1a2b4c" strokeWidth="4" strokeLinecap="round"
            />

            {/* Ticks */}
            {ticks.map((t, i) => (
              <line key={i} x1={t.ox} y1={t.oy} x2={t.ix} y2={t.iy}
                stroke="#334155" strokeWidth={t.isMajor ? "1.2" : "0.9"} strokeLinecap="round"
              />
            ))}

            {/* Active Value Track */}
            {pct > 0.01 && (
              <path d={arcD(58, START, valueEndDeg)} fill="none"
                stroke="url(#ps-track-grad)" strokeWidth="4" strokeLinecap="round"
                filter="url(#ps-glow)"
                style={{ transition: 'd 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            )}

            {/* Value Dot */}
            {pct > 0.01 && (
              <circle cx={dotX} cy={dotY} r={3.5} fill="#ffffff"
                filter="url(#ps-glow)"
                style={{ transition: 'cx 0.8s cubic-bezier(0.4, 0, 0.2, 1), cy 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            )}

            {/* Value Text */}
            <text x={CX} y={CY + 12} textAnchor="middle" fill="#ffffff"
              fontSize="20" fontWeight="800" fontFamily="'Inter', sans-serif"
              style={{ textShadow: `0 0 10px ${pressColor}60` }}
            >
              {pressure.toFixed(2)}
            </text>

            {/* Unit Text */}
            <text x={CX} y={CY + 28} textAnchor="middle" fill="#94a3b8"
              fontSize="8" fontWeight="600"
            >
              Bar
            </text>
          </svg>
        </div>

        {/* Status + Range info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: -16 }}>
          <div style={{
            padding: '4px 14px', borderRadius: 999,
            backgroundColor: `${status.color}18`,
            border: `1px solid ${status.color}40`,
            color: status.color, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              backgroundColor: status.color,
              boxShadow: `0 0 6px ${status.color}`,
            }} />
            {status.label}
          </div>

          {/* Zone legend */}
          <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
            {[
              { color: '#f87171', label: 'Rendah' },
              { color: '#f59e0b', label: 'Waspada' },
              { color: '#10b981', label: 'Normal' },
              { color: '#ef4444', label: 'Over' },
            ].map(z => (
              <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: z.color, opacity: 0.8 }} />
                <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>{z.label}</span>
              </div>
            ))}
          </div>

          {/* Range bar */}
          <div style={{ width: 180, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 8, color: '#475569' }}>0 Bar</span>
              <span style={{ fontSize: 8, color: '#475569' }}>{maxPressure} Bar</span>
            </div>
            <div style={{ height: 4, background: '#1a2b4c', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${pct * 100}%`,
                background: `linear-gradient(90deg, #1d4ed8, ${pressColor})`,
                transition: 'width 0.8s ease',
                boxShadow: `0 0 8px ${pressColor}60`,
              }} />
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
