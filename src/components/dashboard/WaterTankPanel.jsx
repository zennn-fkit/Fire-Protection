import { Droplets } from 'lucide-react';

const WATER_ROWS = [
  { date: '06.05.25', vol: 1.05, status: 'SAVED'   },
  { date: '05.05.25', vol: 0.85, status: 'SAVED'   },
  { date: '04.05.25', vol: 0.90, status: 'SAVED'   },
  { date: '03.05.25', vol: 1.28, status: 'SAVED'   },
  { date: '02.05.25', vol: 1.18, status: 'SAVED'   },
  { date: '01.05.25', vol: 1.50, status: 'PENDING' },
];

export default function WaterTankPanel({ level = 78 }) {
  const levelColor = level < 10 ? '#ef4444' : level < 20 ? '#f59e0b' : '#3b82f6';
  const clampedLevel = Math.max(0, Math.min(100, level));

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        💧 Smart Water Monitoring
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flex: 1 }}>
        {/* Tank Visual */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>Level Air</div>
          <div style={{
            width: 60, height: 100, borderRadius: 8,
            border: `2px solid ${levelColor}60`,
            background: '#080f1e', overflow: 'hidden', position: 'relative',
            boxShadow: `0 0 12px ${levelColor}20`,
          }}>
            {/* Water fill */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: `${clampedLevel}%`,
              background: `linear-gradient(180deg, ${levelColor}80, ${levelColor})`,
              transition: 'height 1s ease',
            }}>
              {/* Wave */}
              <div style={{
                position: 'absolute', top: -2, left: 0, right: 0, height: 6,
                background: `linear-gradient(180deg, ${levelColor}40, transparent)`,
                borderRadius: '50%',
              }} />
            </div>
            {/* Level text overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 14, color: '#fff',
            }}>
              {clampedLevel.toFixed(0)}%
            </div>
          </div>
          <Droplets size={16} color={levelColor} />
        </div>

        {/* History Table */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>Riwayat Pemakaian Air</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Tanggal', 'Volume (m³)', 'Status'].map(h => (
                  <th key={h} style={{ color: '#475569', fontWeight: 700, padding: '4px 6px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1a3558' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WATER_ROWS.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(26,53,88,0.4)' }}>
                  <td style={{ padding: '5px 6px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{r.date}</td>
                  <td style={{ padding: '5px 6px', color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600 }}>{r.vol.toFixed(2)}</td>
                  <td style={{ padding: '5px 6px' }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                      color: r.status === 'SAVED' ? '#10b981' : '#f59e0b',
                      background: r.status === 'SAVED' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    }}>
                      {r.status === 'SAVED' ? '✓ Tersimpan' : '⏳ Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
