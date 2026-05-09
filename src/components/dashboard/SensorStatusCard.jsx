import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const STATUS_MAP = {
  NORMAL:  { icon: CheckCircle,   color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', label: 'Aman'   },
  WARNING: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  label: 'Waspada'},
  DANGER:  { icon: XCircle,       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',   label: 'Bahaya' },
};

function DetectorItem({ label, status, sub }) {
  const s = STATUS_MAP[status] || STATUS_MAP.NORMAL;
  const Icon = s.icon;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 10, transition: 'all 0.3s',
      boxShadow: status === 'DANGER' ? `0 0 12px ${s.border}` : 'none',
    }}>
      <Icon size={18} color={s.color} style={{ flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{label}</div>
        <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
        {sub && <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function SensorStatusCard({ detectors }) {
  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        Status Detektor Kebakaran
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, alignContent: 'stretch' }}>
        <DetectorItem label="Smoke Detector" status={detectors.smoke}   sub="Detektor Asap"    />
        <DetectorItem label="Heat Detector"  status={detectors.heat}    sub="Heat Acc: ±0.3°C" />
        <DetectorItem label="Flame Detector" status={detectors.flame}   sub="Detektor Api"     />
        <DetectorItem label="Thermal Sensor" status={detectors.thermal} sub="Heat Acc: ±2.5%"  />
      </div>
    </div>
  );
}
