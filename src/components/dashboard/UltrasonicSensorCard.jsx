import { useMemo } from 'react';
import { Waves, Ruler } from 'lucide-react';
import HydrantTankStrip from './HydrantTankStrip';

function getLevelColor(level, maxLevel) {
  const pct = level / maxLevel;
  if (pct < 0.15) return '#ef4444';   // merah — kritis rendah
  if (pct < 0.30) return '#f59e0b';   // amber  — waspada
  if (pct < 0.85) return '#3b82f6';   // biru   — normal
  return '#f59e0b';                    // amber  — hampir penuh
}

function getLevelStatus(level, maxLevel) {
  const pct = level / maxLevel;
  if (pct < 0.15) return { label: 'KRITIS RENDAH', color: '#ef4444' };
  if (pct < 0.30) return { label: 'AIR RENDAH',    color: '#f59e0b' };
  if (pct < 0.85) return { label: 'NORMAL',         color: '#3b82f6' };
  return             { label: 'HAMPIR PENUH',   color: '#f59e0b' };
}

export default function UltrasonicSensorCard({
  distanceCm = 0,
  maxDistanceCm = 200,
  title = 'Sensor Ultrasonik',
  compact = false,
  variant,
  embedded = false,
}) {
  const resolvedVariant = variant || (compact ? 'compact' : 'default');

  if (resolvedVariant === 'strip') {
    return (
      <HydrantTankStrip
        distanceCm={distanceCm}
        maxDistanceCm={maxDistanceCm}
        title={title}
        embedded={embedded}
      />
    );
  }
  // distanceCm = jarak pantulan sonar (makin kecil = air makin tinggi)
  // waterLevelCm = ketinggian air = max - jarak
  const waterLevelCm  = Math.max(0, maxDistanceCm - distanceCm);
  const clampedLevel  = Math.max(0, Math.min(maxDistanceCm, waterLevelCm));
  const levelPct      = clampedLevel / maxDistanceCm;   // 0..1
  const levelColor    = getLevelColor(clampedLevel, maxDistanceCm);
  const status        = getLevelStatus(clampedLevel, maxDistanceCm);

  const isCompact = resolvedVariant === 'compact';
  const TANK_H = isCompact ? 120 : 180;
  const TANK_W = isCompact ? 64 : 90;
  const fillH  = TANK_H * levelPct;

  // Ruler tick marks
  const ticks = useMemo(() => {
    const arr = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const isMajor = i % 2 === 0;
      const y = TANK_H - (i / steps) * TANK_H;
      const val = ((i / steps) * maxDistanceCm).toFixed(0);
      arr.push({ y, isMajor, val });
    }
    return arr;
  }, [maxDistanceCm]);

  return (
    <div className={embedded ? "" : "card"} style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, borderLeft: embedded ? '1px solid rgba(56,189,248,0.12)' : 'none' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px 8px',
        borderBottom: embedded ? 'none' : '1px solid rgba(26,53,88,0.6)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Waves size={16} color="#38bdf8" />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {title}
          </div>
          <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>HC-SR04 Ultrasonic • cm</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981',
            boxShadow: '0 0 6px #10b981', animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 8, color: '#10b981', fontWeight: 700, letterSpacing: '0.05em' }}>LIVE</span>
        </div>
      </div>

      {/* Main Body */}
      <div style={{
        display: 'flex',
        flexDirection: isCompact ? 'column' : 'row',
        gap: isCompact ? 12 : 16,
        flex: 1,
        padding: isCompact ? '12px 14px' : '16px 20px 16px',
        alignItems: isCompact ? 'center' : 'flex-start',
      }}>
        {/* Tank Visual */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

          {/* Ruler on left */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 4 }}>
            <svg width="40" height={TANK_H + 8} style={{ overflow: 'visible' }}>
              {ticks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={t.isMajor ? 12 : 18} y1={t.y + 4}
                    x2={30} y2={t.y + 4}
                    stroke={t.isMajor ? '#334155' : '#1e2f47'}
                    strokeWidth={t.isMajor ? '1' : '0.6'}
                  />
                  {t.isMajor && (
                    <text x="8" y={t.y + 7} textAnchor="end"
                      fill="#475569" fontSize="6" fontFamily="'JetBrains Mono', monospace"
                    >
                      {t.val}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* Tank cylinder */}
          <div style={{ position: 'relative' }}>
            {/* Sonar sensor on top */}
            <div style={{
              position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <div style={{
                background: '#1e3a5f', border: '1px solid #3b82f6',
                borderRadius: 4, padding: '2px 8px',
                fontSize: 7, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
                HC-SR04
              </div>
              {/* Sensor beam lines */}
              <div style={{ display: 'flex', gap: 3, height: 8 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 1, height: 8,
                    background: `rgba(59,130,246,${0.3 + i * 0.2})`,
                    borderRadius: 99,
                    animation: `beam 1.5s ease-in-out ${i * 0.3}s infinite`,
                  }} />
                ))}
              </div>
            </div>

            {/* Main tank body */}
            <div style={{
              width: TANK_W, height: TANK_H,
              borderRadius: '4px 4px 10px 10px',
              border: `2px solid ${levelColor}50`,
              background: '#040b16',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: `0 0 20px ${levelColor}20, inset 0 0 20px rgba(0,0,0,0.4)`,
            }}>
              {/* Water fill */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: `${levelPct * 100}%`,
                background: `linear-gradient(180deg, ${levelColor}60 0%, ${levelColor}95 100%)`,
                transition: 'height 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                {/* Wave surface */}
                <svg
                  width={TANK_W} height="16"
                  viewBox={`0 0 ${TANK_W} 16`}
                  style={{ position: 'absolute', top: -8, left: 0 }}
                  preserveAspectRatio="none"
                >
                  <path
                    d={`M0 8 Q${TANK_W * 0.25} 0 ${TANK_W * 0.5} 8 Q${TANK_W * 0.75} 16 ${TANK_W} 8 L${TANK_W} 16 L0 16 Z`}
                    fill={`${levelColor}80`}
                    style={{ animation: 'wave 3s ease-in-out infinite' }}
                  />
                  <path
                    d={`M0 10 Q${TANK_W * 0.33} 2 ${TANK_W * 0.66} 10 Q${TANK_W * 0.83} 16 ${TANK_W} 12 L${TANK_W} 16 L0 16 Z`}
                    fill={`${levelColor}50`}
                    style={{ animation: 'wave 2.5s ease-in-out 0.5s infinite reverse' }}
                  />
                </svg>

                {/* Bubble particles */}
                {levelPct > 0.1 && [0.2, 0.5, 0.75].map((xPct, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    left: `${xPct * 100}%`,
                    bottom: `${20 + i * 20}%`,
                    width: 3 + i,
                    height: 3 + i,
                    borderRadius: '50%',
                    background: `${levelColor}60`,
                    animation: `bubble ${2 + i * 0.7}s ease-in-out ${i * 0.4}s infinite`,
                  }} />
                ))}
              </div>

              {/* Distance marker line */}
              <div style={{
                position: 'absolute',
                top: `${(1 - levelPct) * 100}%`,
                left: 0, right: 0,
                height: 1,
                background: `${levelColor}80`,
                boxShadow: `0 0 4px ${levelColor}`,
              }} />

              {/* Level text overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 900,
                  fontSize: 18, color: '#fff',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                }}>
                  {clampedLevel.toFixed(1)}
                </span>
                <span style={{
                  fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 600,
                }}>
                  cm
                </span>
              </div>
            </div>

            {/* Bottom cap */}
            <div style={{
              width: TANK_W, height: 6,
              background: `${levelColor}30`,
              border: `2px solid ${levelColor}50`,
              borderTop: 'none', borderRadius: '0 0 8px 8px',
            }} />
          </div>
        </div>

        {/* Right: Info panel */}
        <div style={{
          flex: 1,
          width: isCompact ? '100%' : undefined,
          display: 'flex',
          flexDirection: 'column',
          gap: isCompact ? 8 : 10,
          paddingTop: isCompact ? 0 : 4,
        }}>
          {/* Status pill */}
          <div style={{
            padding: '6px 12px', borderRadius: 8,
            backgroundColor: `${status.color}15`,
            border: `1px solid ${status.color}30`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: status.color,
              boxShadow: `0 0 6px ${status.color}`,
            }} />
            <span style={{ fontSize: 9, color: status.color, fontWeight: 800, letterSpacing: '0.06em' }}>
              {status.label}
            </span>
          </div>

          {/* Metrics */}
          <div style={{
            display: isCompact ? 'grid' : 'contents',
            gridTemplateColumns: isCompact ? '1fr 1fr' : undefined,
            gap: isCompact ? 6 : undefined,
          }}>
          {[
            { label: 'Ketinggian Air', value: `${clampedLevel.toFixed(1)} cm`, color: levelColor },
            { label: 'Jarak Sonar', value: `${distanceCm.toFixed(1)} cm`, color: '#94a3b8' },
            { label: 'Kapasitas', value: `${(levelPct * 100).toFixed(1)}%`, color: levelColor },
            { label: 'Max Tangki', value: `${maxDistanceCm} cm`, color: '#64748b' },
          ].map(m => (
            <div key={m.label} style={{
              padding: isCompact ? '6px 8px' : '8px 10px', borderRadius: 8,
              marginBottom: isCompact ? 0 : 10,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(26,53,88,0.5)',
            }}>
              <div style={{ fontSize: 8, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                {m.label}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: isCompact ? 13 : 16, fontWeight: 800, color: m.color,
              }}>
                {m.value}
              </div>
            </div>
          ))}
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 8, color: '#475569', fontWeight: 600 }}>LEVEL</span>
              <span style={{ fontSize: 8, color: levelColor, fontWeight: 700 }}>{(levelPct * 100).toFixed(0)}%</span>
            </div>
            <div style={{ height: 6, background: '#0d1f38', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${levelPct * 100}%`,
                background: `linear-gradient(90deg, #1d4ed8, ${levelColor})`,
                transition: 'width 1.2s ease',
                boxShadow: `0 0 8px ${levelColor}60`,
              }} />
            </div>
          </div>

          {!isCompact && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 6,
              background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)',
            }}>
              <Ruler size={12} color="#38bdf8" />
              <span style={{ fontSize: 8, color: '#64748b' }}>
                Mengukur dari atas tangki ke permukaan air
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes wave { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-8px)} }
        @keyframes bubble { 0%{transform:translateY(0);opacity:0.7} 100%{transform:translateY(-40px);opacity:0} }
        @keyframes beam { 0%,100%{opacity:0.2;height:8px} 50%{opacity:1;height:12px} }
      `}</style>
    </div>
  );
}
