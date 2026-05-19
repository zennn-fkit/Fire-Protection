
import { ZONE_DEFAULT, ZONE_VOLTAGE } from '../utils/gaugeZones';
import { useSensor } from '../context/SensorContext';
import GaugeCard from '../components/dashboard/GaugeCard';
import MonitoringRealtimePanel from '../components/dashboard/MonitoringRealtimePanel';
import SensorStatusCard from '../components/dashboard/SensorStatusCard';
import Header from '../components/layout/Header';

export default function Dashboard() {
  const { state } = useSensor();
  const { panelData, node3, detectors, water_distance, energyHistory } = state;

  const MAX_TANK_CM = 200;

  const toNumber = value => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  };
  const dangerValues = [
    toNumber(panelData?.temperature_sht) >= 60,
    toNumber(panelData?.thermal_temp) >= 60,
    toNumber(node3?.temperature) >= 60,
    toNumber(panelData?.co2_ppm) >= 1.5,
    Number(panelData?.uv_detected) === 1,
  ];
  const anyDanger = dangerValues.some(Boolean);

  return (
    <div className="page-gradient">
      <Header title="Monitoring Sensor" />

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

        <MonitoringRealtimePanel
          energyHistory={energyHistory}
          waterDistance={water_distance}
          maxTankCm={MAX_TANK_CM}
        />

        {detectors && <SensorStatusCard detectors={detectors} />}

      </div>
    </div>
  );
}
