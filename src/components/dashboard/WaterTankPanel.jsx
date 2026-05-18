import { Droplets } from 'lucide-react';

export default function WaterTankPanel({ level = 78 }) {
  const levelColor   = level < 10 ? '#ef4444' : level < 20 ? '#f59e0b' : '#3b82f6';
  const clampedLevel = Math.max(0, Math.min(100, level));
  const statusLabel  = level < 10 ? 'KRITIS' : level < 20 ? 'RENDAH' : 'NORMAL';

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 20px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        💧 Level Air Tangki
      </div>

      {/* Tank Visual */}
      <div style={{
        width: 56, height: 90, borderRadius: '4px 4px 8px 8px',
        border: `2px solid ${levelColor}60`,
        background: '#080f1e', overflow: 'hidden', position: 'relative',
        boxShadow: `0 0 14px ${levelColor}20`,
      }}>
        {/* Water fill */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${clampedLevel}%`,
          background: `linear-gradient(180deg, ${levelColor}70, ${levelColor}cc)`,
          transition: 'height 1s ease',
        }}>
          {/* Wave surface */}
          <div style={{
            position: 'absolute', top: -3, left: 0, right: 0, height: 6,
            background: `linear-gradient(180deg, ${levelColor}50, transparent)`,
            borderRadius: '50%',
          }} />
        </div>
        {/* Level text overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 1,
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 900,
            fontSize: 14, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.8)',
          }}>
            {clampedLevel.toFixed(0)}%
          </span>
        </div>
      </div>

      <Droplets size={14} color={levelColor} />

      {/* Status badge */}
      <div style={{
        padding: '3px 10px', borderRadius: 999,
        background: `${levelColor}15`,
        border: `1px solid ${levelColor}40`,
        color: levelColor, fontSize: 9, fontWeight: 800,
        letterSpacing: '0.05em',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: levelColor, boxShadow: `0 0 5px ${levelColor}` }} />
        {statusLabel}
      </div>
    </div>
  );
}
