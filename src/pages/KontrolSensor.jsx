import { useSensor } from '../context/SensorContext';
import GaugeCard from '../components/dashboard/GaugeCard';
import Header from '../components/layout/Header';
import { ZONE_DEFAULT } from '../utils/gaugeZones';

export default function KontrolSensor() {
  const { state } = useSensor();
  const { panelData } = state; // Master node contains the environment sensors

  return (
    <div className="page-gradient" style={{ minHeight: '100vh' }}>
      <Header title="Kontrol Sensor" />

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {panelData ? (
            <>
              <GaugeCard
                label="Suhu SHT" value={panelData.temperature_sht} min={0} max={100}
                unit="°C" threshKey="temperature_sht" decimals={2}
                zones={ZONE_DEFAULT}
              />
              <GaugeCard
                label="Kelembaban" value={panelData.humidity} min={0} max={100}
                unit="%" threshKey="humidity" decimals={2}
                zones={ZONE_DEFAULT}
              />
              <GaugeCard
                label="Thermal" value={panelData.thermal_temp} min={0} max={100}
                unit="°C" threshKey="thermal_temp" decimals={2}
                zones={ZONE_DEFAULT}
              />
              <GaugeCard
                label="CO2 Carbon" value={panelData.co2_ppm} min={0} max={2}
                unit="ppm" threshKey="co2_ppm" decimals={3}
                zones={ZONE_DEFAULT}
              />
              <GaugeCard
                label="UV" 
                value={panelData.uv_detected} 
                displayValue={panelData.uv_detected ? 'Terdeteksi' : 'Tidak Terdeteksi'}
                min={0} max={1}
                unit="Status" threshKey="uv_detected" decimals={0}
                zones={ZONE_DEFAULT}
              />
            </>
          ) : (
            <div style={{ gridColumn: 'span 3', color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>
              Menunggu data sensor...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
