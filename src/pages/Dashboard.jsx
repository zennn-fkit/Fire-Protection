
import { ZONE_DEFAULT, ZONE_VOLTAGE, ZONE_FREQUENCY } from '../utils/gaugeZones';
import { useSensor } from '../context/SensorContext';
import GaugeCard from '../components/dashboard/GaugeCard';
import EnergyChart      from '../components/dashboard/EnergyChart';
import SensorStatusCard from '../components/dashboard/SensorStatusCard';
import WaterTankPanel   from '../components/dashboard/WaterTankPanel';
import EnvPanel         from '../components/dashboard/EnvPanel';
import Header           from '../components/layout/Header';



export default function Dashboard() {
  const { state } = useSensor();
  const { panelData, node3, detectors, water_level, energyHistory } = state;

  const anyDanger  = detectors ? Object.values(detectors).some(v => v === 'DANGER') : false;
  const anyWarning = detectors ? Object.values(detectors).some(v => v === 'WARNING') : false;

  return (
    <div className="page-gradient">
      <Header title="Dashboard Monitoring" />

      {/* Critical Alert Banner */}
      {anyDanger && (
        <div style={{
          margin: '16px 28px 0', padding: '12px 20px', borderRadius: 12,
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'danger-pulse 2s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
            BAHAYA KEBAKARAN TERDETEKSI! Harap segera ambil tindakan!
          </span>
        </div>
      )}

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ── Row 1: Power Gauges ───────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {panelData && (
            <>
              <GaugeCard
                label="Tegangan" value={panelData.voltage} min={180} max={260}
                unit="Volt AC" threshKey="voltage" decimals={1}
                zones={ZONE_VOLTAGE}
              />
              <GaugeCard
                label="Arus" value={panelData.current_amp} min={0} max={180}
                unit="Ampere" threshKey="current_amp" decimals={1}
                zones={ZONE_DEFAULT}
              />
              <GaugeCard
                label="Watt" value={panelData.power_kw * 1000} min={0} max={3000}
                unit="Watt" threshKey="power_kw" decimals={0}
                zones={ZONE_DEFAULT}
              />
              <GaugeCard
                label="Energy" value={panelData.energy_kwh} min={0} max={10000}
                unit="kWh" threshKey="energy_kwh" decimals={2}
                zones={ZONE_DEFAULT}
              />
            </>
          )}
        </div>

        {/* ── Row 2: Charts ───────────────────────────────────── */}
        {energyHistory && energyHistory.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <EnergyChart data={energyHistory} title="Monitoring Realtime 1" initialMetric="kw" />
            <EnergyChart data={energyHistory} title="Monitoring Realtime 2" initialMetric="voltage" />
          </div>
        )}

        {/* ── Row 3: Env Panels + Water + Detectors ───────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {node3 && (
            <div style={{ gridColumn: 'span 2', display: 'flex' }}>
              <EnvPanel 
                title="Monitoring Sensor" 
                nodes={[
                  { label: 'Lingkungan (Node 3)', data: node3 }
                ]}
                style={{ flex: 1 }}
              />
            </div>
          )}
          {water_level !== null && <WaterTankPanel level={water_level} />}
          {detectors && <SensorStatusCard detectors={detectors} />}
        </div>

      </div>
    </div>
  );
}
