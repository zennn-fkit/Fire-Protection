import { useState } from 'react';
import { useSensor } from '../context/SensorContext';
import Header from '../components/layout/Header';

// Components from KontrolSensor
import GaugeCard from '../components/dashboard/GaugeCard';
import SensorStatusCard from '../components/dashboard/SensorStatusCard';
import { ZONE_DEFAULT } from '../utils/gaugeZones';

// Components from GasHydrant
import GasPanel from '../components/dashboard/GasPanel';
import HydrantPanel from '../components/dashboard/HydrantPanel';
import WaterTankPanel from '../components/dashboard/WaterTankPanel';
import PressureSensorCard from '../components/dashboard/PressureSensorCard';
import UltrasonicSensorCard from '../components/dashboard/UltrasonicSensorCard';
import TankConfigPanel from '../components/dashboard/TankConfigPanel';
import { Flame, Droplets, Gauge, Waves, Settings, Thermometer } from 'lucide-react';

const TAB_STYLE = (active) => ({
  flex: 1,
  padding: '12px 0',
  background: 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
  color: active ? '#e2e8f0' : '#64748b',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  transition: 'all 0.3s',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
});

const SUBTAB_STYLE = (active) => ({
  padding: '7px 16px',
  background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
  border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'rgba(26,53,88,0.6)'}`,
  borderRadius: 8,
  color: active ? '#93c5fd' : '#64748b',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  transition: 'all 0.25s',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

export default function Monitoring() {
  const { state } = useSensor();
  const { panelData, node4, water_level, water_pressure, water_distance, detectors } = state;
  const [activeTab, setActiveTab] = useState('environment'); // Default tab
  
  // Sub-tabs
  const [gasSubTab, setGasSubTab] = useState('overview');
  const [hydrantSubTab, setHydrantSubTab] = useState('overview');

  // Hitung ketinggian air (cm) dari jarak ultrasonik
  const MAX_DIST_CM = 200;
  const waterLevelCm = water_distance != null ? Math.max(0, MAX_DIST_CM - water_distance) : null;

  return (
    <div className="page-gradient" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title="Monitoring Area" />

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

        {/* Main Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1a3558' }}>
          <button onClick={() => setActiveTab('environment')} style={TAB_STYLE(activeTab === 'environment')}>
            <Thermometer size={16} /> Lingkungan
          </button>
          <button onClick={() => setActiveTab('gas')} style={TAB_STYLE(activeTab === 'gas')}>
            <Flame size={16} /> Smart Gas
          </button>
          <button onClick={() => setActiveTab('hydrant')} style={TAB_STYLE(activeTab === 'hydrant')}>
            <Droplets size={16} /> Hydrant
          </button>
        </div>

        {/* ── ENVIRONMENT TAB (Lama: Kontrol Sensor) ── */}
        {activeTab === 'environment' && (
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

            {/* Panel Status Detektor Kebakaran */}
            {detectors && (
              <div style={{ gridColumn: 'span 3', marginTop: 8 }}>
                <SensorStatusCard detectors={detectors} />
              </div>
            )}
          </div>
        )}

        {/* ── GAS TAB ── */}
        {activeTab === 'gas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Sub-tab Navigation */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setGasSubTab('overview')} style={SUBTAB_STYLE(gasSubTab === 'overview')}>
                <Flame size={13} /> Overview
              </button>
              <button onClick={() => setGasSubTab('pressure')} style={SUBTAB_STYLE(gasSubTab === 'pressure')}>
                <Gauge size={13} /> Pressure Sensor
              </button>
            </div>

            {/* ── Overview sub-tab ── */}
            {gasSubTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                {/* CO2 PRESSURE */}
                <GasPanel
                  title="SMART CO2 PRESSURE MONITORING"
                  pressure={panelData?.gas_pressure ?? 0}
                  maxPressure={12}
                  valve_status={panelData?.gas_valve === 'TERBUKA' || panelData?.gas_valve === 'OPEN' ? 'OPEN' : 'CLOSED'}
                  valveLabel="Status Kebocoran"
                  iconColor="#ef4444"
                />
                {/* SCHEMATIC */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 150 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 0 12px' }}>
                    FIELD SCHEMATIC / LIVE
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{
                      width: '100%', height: 120,
                      background: '#040b16', borderRadius: 12, border: '1px solid #1a3558',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 12px 12px 12px', position: 'relative'
                    }}>
                      <Flame size={48} color="#10b981" />
                      <div style={{
                        position: 'absolute', bottom: 10, right: 10,
                        padding: '4px 10px', border: '1px solid #10b981', borderRadius: 4,
                        fontSize: 8, color: '#10b981', fontWeight: 700, letterSpacing: '0.05em'
                      }}>
                        GAS-UNIT
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Pressure Sensor sub-tab ── */}
            {gasSubTab === 'pressure' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Gauge size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>
                      Sensor Tekanan Gas — MQ-7 / CO2
                    </div>
                    <div style={{ fontSize: 9, color: '#475569', lineHeight: 1.5 }}>
                      Mendeteksi tekanan gas dalam sistem tabung/pipa gas dalam satuan <strong style={{ color: '#64748b' }}>Bar</strong>.
                      Range normal: <strong style={{ color: '#10b981' }}>0 – 5 Bar</strong>.
                      Batas waspada: <strong style={{ color: '#f59e0b' }}>{'>'} 8 Bar (Overpressure)</strong>.
                    </div>
                  </div>
                </div>

                <PressureSensorCard
                  pressure={panelData?.gas_pressure ?? 0}
                  maxPressure={12}
                  title="Tekanan Gas CO2"
                  subtitle="Sensor Gas MQ-7 / CO2 • Bar"
                  iconColor="#ef4444"
                />
              </div>
            )}
          </div>
        )}

        {/* ── HYDRANT TAB ── */}
        {activeTab === 'hydrant' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Sub-tab Navigation */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setHydrantSubTab('overview')} style={SUBTAB_STYLE(hydrantSubTab === 'overview')}>
                <Droplets size={13} /> Overview
              </button>
              <button onClick={() => setHydrantSubTab('pressure')} style={SUBTAB_STYLE(hydrantSubTab === 'pressure')}>
                <Gauge size={13} /> Pressure Sensor
              </button>
              <button onClick={() => setHydrantSubTab('ultrasonic')} style={SUBTAB_STYLE(hydrantSubTab === 'ultrasonic')}>
                <Waves size={13} /> Ultrasonik
              </button>
              <button onClick={() => setHydrantSubTab('config')} style={SUBTAB_STYLE(hydrantSubTab === 'config')}>
                <Settings size={13} /> Konfigurasi Tangki
              </button>
            </div>

            {/* ── Overview sub-tab ── */}
            {hydrantSubTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                {node4 ? (
                  <HydrantPanel
                    pressure={node4.pressure}
                    valve_status={node4.valve_status}
                    maxPressure={12}
                  />
                ) : (
                  <HydrantPanel pressure={0} valve_status="CLOSED" maxPressure={12} />
                )}

                <WaterTankPanel level={water_level !== null ? water_level : 0} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Gauge size={14} color="#3b82f6" />
                      <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Water Pressure
                      </span>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 900, color: '#3b82f6' }}>
                      {water_pressure !== null ? water_pressure.toFixed(2) : '—'}
                    </div>
                    <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, marginTop: 2 }}>Bar</div>
                    <div style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>
                      Sensor: Pressure Transducer
                    </div>
                  </div>

                  <div className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Waves size={14} color="#38bdf8" />
                      <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Ketinggian Air
                      </span>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 900, color: '#38bdf8' }}>
                      {water_distance !== null ? (200 - water_distance).toFixed(1) : '—'}
                    </div>
                    <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, marginTop: 2 }}>cm</div>
                    <div style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>
                      Sensor: HC-SR04 Ultrasonik
                    </div>
                  </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 150 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 0 12px' }}>
                    FIELD SCHEMATIC / LIVE
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{
                      width: '100%', height: 120,
                      background: '#040b16', borderRadius: 12, border: '1px solid #1a3558',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 12px 12px 12px', position: 'relative'
                    }}>
                      <Droplets size={48} color="#10b981" />
                      <div style={{
                        position: 'absolute', bottom: 10, right: 10,
                        padding: '4px 10px', border: '1px solid #10b981', borderRadius: 4,
                        fontSize: 8, color: '#10b981', fontWeight: 700, letterSpacing: '0.05em'
                      }}>
                        HYD-01 / ACTIVE
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Pressure Sensor sub-tab ── */}
            {hydrantSubTab === 'pressure' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Gauge size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#93c5fd', marginBottom: 2 }}>
                      Sensor Tekanan Air — Pressure Transducer
                    </div>
                    <div style={{ fontSize: 9, color: '#475569', lineHeight: 1.5 }}>
                      Mendeteksi tekanan air dalam sistem pipa hydrant dalam satuan <strong style={{ color: '#64748b' }}>Bar</strong>.
                      Range normal: <strong style={{ color: '#10b981' }}>4 – 8.5 Bar</strong>.
                      Batas aman: <strong style={{ color: '#f59e0b' }}>2 – 4 Bar (waspada)</strong>.
                    </div>
                  </div>
                </div>

                <PressureSensorCard
                  pressure={water_pressure !== null ? water_pressure : 0}
                  maxPressure={10}
                  title="Tekanan Air Hydrant"
                />

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    📊 Perbandingan Tekanan
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      {
                        label: 'Pressure Transducer (Tangki)',
                        value: water_pressure !== null ? water_pressure : 0,
                        max: 10,
                        color: '#3b82f6',
                        unit: 'Bar',
                      },
                      {
                        label: 'Hydrant Node (Jaringan Pipa)',
                        value: node4?.pressure ?? 0,
                        max: 12,
                        color: '#10b981',
                        unit: 'Bar',
                      },
                    ].map(item => {
                      const pct = Math.max(0, Math.min(1, item.value / item.max));
                      return (
                        <div key={item.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{item.label}</span>
                            <span style={{ fontSize: 11, color: item.color, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                              {item.value.toFixed(2)} {item.unit}
                            </span>
                          </div>
                          <div style={{ height: 8, background: '#0d1f38', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 99,
                              width: `${pct * 100}%`,
                              background: `linear-gradient(90deg, #1d4ed8, ${item.color})`,
                              transition: 'width 0.8s ease',
                              boxShadow: `0 0 8px ${item.color}60`,
                            }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                            <span style={{ fontSize: 7, color: '#334155' }}>0 {item.unit}</span>
                            <span style={{ fontSize: 7, color: '#334155' }}>{item.max} {item.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Ultrasonic sub-tab ── */}
            {hydrantSubTab === 'ultrasonic' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(56,189,248,0.08)',
                  border: '1px solid rgba(56,189,248,0.25)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Waves size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7dd3fc', marginBottom: 2 }}>
                      Sensor Ultrasonik — HC-SR04
                    </div>
                    <div style={{ fontSize: 9, color: '#475569', lineHeight: 1.5 }}>
                      Mengukur ketinggian air di dalam tangki hydrant menggunakan pantulan gelombang ultrasonik.
                      Sensor dipasang di <strong style={{ color: '#64748b' }}>atas tangki</strong> dan mengukur jarak ke permukaan air.
                      Ketinggian air = Max Tangki − Jarak Terukur.
                    </div>
                  </div>
                </div>

                <UltrasonicSensorCard
                  distanceCm={water_distance !== null ? water_distance : 100}
                  maxDistanceCm={200}
                  title="Level Air Tangki Hydrant"
                />

                <WaterTankPanel level={water_level !== null ? water_level : 0} />
              </div>
            )}

            {/* ── Konfigurasi Tangki sub-tab ── */}
            {hydrantSubTab === 'config' && (
              <TankConfigPanel
                waterLevelCm={waterLevelCm}
                waterDistanceCm={water_distance}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
