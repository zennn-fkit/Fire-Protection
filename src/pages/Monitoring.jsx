import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Flame, Droplets, Gauge, Waves, Settings, Thermometer, Wind, Sun, Activity } from 'lucide-react';

function getComfortLevel(temp, humi) {
  if (temp == null || humi == null) return { label: 'Mengukur', color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
  if (temp >= 20 && temp <= 26 && humi >= 40 && humi <= 60) {
    return { label: 'Ideal / Nyaman', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  }
  if (humi > 65 && temp > 26) {
    return { label: 'Lembab & Hangat', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  }
  if (temp > 26 && temp <= 30) {
    return { label: 'Cukup Hangat', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' };
  }
  if (temp > 30) {
    return { label: 'Suhu Tinggi', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  }
  if (temp < 20) {
    return { label: 'Suhu Rendah', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' };
  }
  return { label: 'Normal', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
}

const TAB_STYLE = (active) => ({
  flex: 1,
  padding: '12px 0',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  color: active ? '#e2e8f0' : '#64748b',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  transition: 'color 0.3s',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
  position: 'relative',
});

const contentVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

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
  const { panelData, node2, node3, water_level, water_pressure, water_distance, detectors } = state;
  const [activeTab, setActiveTab] = useState('environment'); // Default tab

  // Sub-tabs
  const [gasSubTab, setGasSubTab] = useState('overview');
  const [hydrantSubTab, setHydrantSubTab] = useState('overview');

  // History for environment trends (temp, humidity)
  const [envHistory, setEnvHistory] = useState([]);

  useEffect(() => {
    if (!panelData) return;
    setEnvHistory(prev => {
      const lastPt = prev[prev.length - 1];
      if (
        lastPt &&
        lastPt.temp === panelData.temperature_sht &&
        lastPt.humi === panelData.humidity
      ) {
        return prev;
      }
      const newPt = {
        temp: panelData.temperature_sht ?? 0,
        humi: panelData.humidity ?? 0,
      };
      const updated = [...prev, newPt];
      if (updated.length > 15) {
        updated.shift();
      }
      return updated;
    });
  }, [panelData]);

  // Hitung ketinggian air (cm) dari jarak ultrasonik
  const MAX_DIST_CM = 200;
  const waterLevelCm = water_distance != null ? Math.max(0, MAX_DIST_CM - water_distance) : null;

  return (
    <div className="page-gradient" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title="Monitoring Area" />

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

        {/* Main Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1a3558', position: 'relative' }}>
          {[{ key: 'environment', icon: Thermometer, label: 'Lingkungan' },
            { key: 'gas', icon: Flame, label: 'Smart Gas' },
            { key: 'hydrant', icon: Droplets, label: 'Hydrant' }].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={TAB_STYLE(activeTab === tab.key)}>
                <Icon size={16} /> {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="monitoring-tab-indicator"
                    style={{
                      position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg, #6366F1, #3b82f6)',
                      borderRadius: 2,
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── ENVIRONMENT TAB (Lama: Kontrol Sensor) ── */}
        <AnimatePresence mode="wait">
        {activeTab === 'environment' && (
          <motion.div key="env" variants={contentVariants} initial="initial" animate="animate" exit="exit">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 16 }}>
            {panelData ? (
              <>
                {[
                  { label: 'Suhu SHT', value: panelData.temperature_sht, min: 0, max: 100, unit: '°C', threshKey: 'temperature_sht', decimals: 2, icon: Thermometer },
                  { label: 'Kelembaban', value: panelData.humidity, min: 0, max: 100, unit: '%', threshKey: 'humidity', decimals: 2, icon: Droplets },
                  { label: 'Thermal', value: panelData.thermal_temp, min: 0, max: 100, unit: '°C', threshKey: 'thermal_temp', decimals: 2, icon: Flame },
                  { label: 'CO2 Carbon', value: panelData.co2_ppm, min: 0, max: 2, unit: 'ppm', threshKey: 'co2_ppm', decimals: 3, icon: Wind },
                  { label: 'UV', value: panelData.uv_value, displayValue: panelData.uv_value ? 'Terdeteksi' : 'Tidak Terdeteksi', min: 0, max: 1, unit: 'Status', threshKey: 'uv_detected', decimals: 0, icon: Sun },
                ].map((g) => (
                  <motion.div key={g.label} variants={staggerItem} whileHover={{ y: -4, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
                    <GaugeCard {...g} zones={ZONE_DEFAULT} />
                  </motion.div>
                ))}

                {/* 6th Card: Analisis Lingkungan & Tren */}
                {(() => {
                  const comfort = getComfortLevel(panelData.temperature_sht, panelData.humidity);
                  const hasHistory = envHistory.length >= 2;
                  const temps = hasHistory ? envHistory.map(h => h.temp) : [panelData.temperature_sht ?? 25];
                  const humis = hasHistory ? envHistory.map(h => h.humi) : [panelData.humidity ?? 50];
                  
                  // Smart auto-scaling bounds helper to make changes easy to see
                  const getBounds = (vals, minSpan, defaultVal) => {
                    if (!hasHistory || vals.length === 0) {
                      return { minBound: defaultVal - minSpan, maxBound: defaultVal + minSpan };
                    }
                    const maxVal = Math.max(...vals);
                    const minVal = Math.min(...vals);
                    const diff = maxVal - minVal;
                    const span = Math.max(diff, minSpan);
                    const mid = (maxVal + minVal) / 2;
                    return {
                      minBound: mid - span * 0.55,
                      maxBound: mid + span * 0.55
                    };
                  };

                  const { minBound: minTemp, maxBound: maxTemp } = getBounds(temps, 0.5, 25);
                  const { minBound: minHumi, maxBound: maxHumi } = getBounds(humis, 2.0, 50);

                  const getSvgPath = (data, minVal, maxVal, key, width, height) => {
                    if (data.length < 2) return '';
                    const range = maxVal - minVal;
                    return data.map((pt, idx) => {
                      const x = 5 + (idx / (data.length - 1)) * (width - 10);
                      const val = pt[key];
                      const y = (height - 5) - (range > 0 ? ((val - minVal) / range) * (height - 10) : (height - 10) / 2);
                      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }).join(' ');
                  };

                  const getFillPath = (data, minVal, maxVal, key, width, height) => {
                    if (data.length < 2) return '';
                    const linePath = getSvgPath(data, minVal, maxVal, key, width, height);
                    const lastX = width - 5;
                    const firstX = 5;
                    const baseY = height - 2;
                    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
                  };

                  const tempPath = getSvgPath(envHistory, minTemp, maxTemp, 'temp', 150, 45);
                  const tempFillPath = getFillPath(envHistory, minTemp, maxTemp, 'temp', 150, 45);
                  const humiPath = getSvgPath(envHistory, minHumi, maxHumi, 'humi', 150, 45);
                  const humiFillPath = getFillPath(envHistory, minHumi, maxHumi, 'humi', 150, 45);

                  const lastTempY = (45 - 5) - ((temps[temps.length - 1] - minTemp) / (maxTemp - minTemp || 1)) * (45 - 10);
                  const lastHumiY = (45 - 5) - ((humis[humis.length - 1] - minHumi) / (maxHumi - minHumi || 1)) * (45 - 10);

                  return (
                    <motion.div variants={staggerItem} whileHover={{ y: -4, transition: { duration: 0.2 } }} style={{ height: '100%' }}>
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '12px 14px', height: '100%', minHeight: 160, justifyContent: 'space-between' }}>
                        <div>
                          {/* Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              <Activity size={13} color="#6366F1" />
                              <span>Analisis Tren</span>
                            </div>
                            <div style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              backgroundColor: comfort.bg,
                              color: comfort.color,
                              border: `1px solid ${comfort.color}30`,
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.02em',
                              boxShadow: `0 0 8px ${comfort.color}15`,
                            }}>
                              {comfort.label}
                            </div>
                          </div>

                          {/* Split Sparklines Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 10
                          }}>
                            {/* Left Column: Temperature Trend */}
                            <div style={{
                              background: '#040b16',
                              borderRadius: 8,
                              padding: '8px',
                              border: '1px solid rgba(251, 146, 60, 0.15)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>Suhu SHT</span>
                                <span style={{ fontSize: 11, color: '#fb923c', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                                  {panelData.temperature_sht?.toFixed(2) ?? '-'}°C
                                </span>
                              </div>
                              
                              <div style={{ height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                {envHistory.length >= 2 ? (
                                  <svg viewBox="0 0 150 45" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                    <defs>
                                      <linearGradient id="temp-fill-split" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#fb923c" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
                                      </linearGradient>
                                    </defs>
                                    {/* Guides */}
                                    <line x1="5" y1="10" x2="145" y2="10" stroke="rgba(251, 146, 60, 0.08)" strokeDasharray="2,2" strokeWidth="0.75" />
                                    <line x1="5" y1="22.5" x2="145" y2="22.5" stroke="rgba(251, 146, 60, 0.08)" strokeDasharray="2,2" strokeWidth="0.75" />
                                    <line x1="5" y1="35" x2="145" y2="35" stroke="rgba(251, 146, 60, 0.08)" strokeDasharray="2,2" strokeWidth="0.75" />
                                    
                                    {tempFillPath && <path d={tempFillPath} fill="url(#temp-fill-split)" />}
                                    {tempPath && <path d={tempPath} fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
                                    <circle cx={5 + (envHistory.length - 1) * (140 / (envHistory.length - 1))} cy={lastTempY} r="2.5" fill="#fb923c" stroke="#ffffff" strokeWidth="0.75" />
                                  </svg>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 9 }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#10b981', animation: 'live-blink 1.5s infinite' }} />
                                    <span>Memuat...</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Column: Humidity Trend */}
                            <div style={{
                              background: '#040b16',
                              borderRadius: 8,
                              padding: '8px',
                              border: '1px solid rgba(96, 165, 250, 0.15)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>Kelembaban</span>
                                <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                                  {panelData.humidity?.toFixed(2) ?? '-'}%
                                </span>
                              </div>
                              
                              <div style={{ height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                {envHistory.length >= 2 ? (
                                  <svg viewBox="0 0 150 45" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                    <defs>
                                      <linearGradient id="humi-fill-split" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                                      </linearGradient>
                                    </defs>
                                    {/* Guides */}
                                    <line x1="5" y1="10" x2="145" y2="10" stroke="rgba(96, 165, 250, 0.08)" strokeDasharray="2,2" strokeWidth="0.75" />
                                    <line x1="5" y1="22.5" x2="145" y2="22.5" stroke="rgba(96, 165, 250, 0.08)" strokeDasharray="2,2" strokeWidth="0.75" />
                                    <line x1="5" y1="35" x2="145" y2="35" stroke="rgba(96, 165, 250, 0.08)" strokeDasharray="2,2" strokeWidth="0.75" />
                                    
                                    {humiFillPath && <path d={humiFillPath} fill="url(#humi-fill-split)" />}
                                    {humiPath && <path d={humiPath} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
                                    <circle cx={5 + (envHistory.length - 1) * (140 / (envHistory.length - 1))} cy={lastHumiY} r="2.5" fill="#60a5fa" stroke="#ffffff" strokeWidth="0.75" />
                                  </svg>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 9 }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#10b981', animation: 'live-blink 1.5s infinite' }} />
                                    <span>Memuat...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </>
            ) : (
              <div style={{ gridColumn: 'span 3', color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>
                Menunggu data sensor...
              </div>
            )}


            {/* Panel Status Detektor Kebakaran */}
            {detectors && (
              <motion.div variants={staggerItem} style={{ gridColumn: 'span 3', marginTop: 8 }}>
                <SensorStatusCard detectors={detectors} />
              </motion.div>
            )}
          </motion.div>
          </motion.div>
        )}

        {/* ── GAS TAB ── */}
        {activeTab === 'gas' && (
          <motion.div key="gas" variants={contentVariants} initial="initial" animate="animate" exit="exit">
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
                  pressure={node2?.gas_pressure ?? 0}
                  maxPressure={12}
                  valve_status={node2?.gas_valve_status === 'OPEN' ? 'OPEN' : 'CLOSED'}
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
                  pressure={node2?.gas_pressure ?? 0}
                  maxPressure={12}
                  title="Tekanan Gas CO2"
                  subtitle="Sensor Gas MQ-7 / CO2 • Bar"
                  iconColor="#ef4444"
                />
              </div>
            )}
          </div>
          </motion.div>
        )}

        {/* ── HYDRANT TAB ── */}
        {activeTab === 'hydrant' && (
          <motion.div key="hydrant" variants={contentVariants} initial="initial" animate="animate" exit="exit">
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 2-Column Grid (Hydrant Panel + Water Tank Panel) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                  {node3 ? (
                    <HydrantPanel
                      pressure={node3.water_pressure}
                      valve_status={node3.water_valve_status}
                      maxPressure={12}
                    />
                  ) : (
                    <HydrantPanel pressure={0} valve_status="CLOSED" maxPressure={12} />
                  )}

                  <WaterTankPanel 
                    level={water_level !== null ? water_level : 0} 
                    pressure={water_pressure !== null ? water_pressure : 0}
                    distanceCm={water_distance !== null ? (200 - water_distance) : 0}
                  />
                </div>

                {/* Field Schematic / Live */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 180 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 0 12px' }}>
                    🚒 FIELD SCHEMATIC / LIVE
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '12px 24px' }}>
                    <div style={{
                      width: '100%', height: 140,
                      background: 'radial-gradient(circle at center, #0a192f 0%, #020813 100%)',
                      borderRadius: 12, border: '1px solid #1e293b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                      boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.05)'
                    }}>
                      {/* Tech lines in background */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
                        backgroundSize: '16px 16px', opacity: 0.5
                      }} />

                      {/* Custom High-Tech Droplet SVG */}
                      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="120" height="120" viewBox="0 0 150 150" style={{ overflow: 'visible' }}>
                          <defs>
                            <filter id="glow-heavy" x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur stdDeviation="5" result="blur1" />
                              <feGaussianBlur stdDeviation="2" result="blur2" />
                              <feMerge>
                                <feMergeNode in="blur1" />
                                <feMergeNode in="blur2" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                            
                            <linearGradient id="dropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                              <stop offset="50%" stopColor="#059669" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#047857" stopOpacity="1" />
                            </linearGradient>

                            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>

                          {/* Outer scanning lines */}
                          <circle cx="75" cy="75" r="62" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" />
                          <circle cx="75" cy="75" r="54" fill="none" stroke="url(#ringGrad)" strokeWidth="1.5" strokeDasharray="5, 6" 
                                  style={{ animation: 'hydrantDropletSpin 20s linear infinite', transformOrigin: '75px 75px' }} />
                          
                          {/* Tech polygon */}
                          <polygon points="75,22 121,48 121,102 75,128 29,102 29,48" fill="none" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="1" />

                          {/* Glow background */}
                          <path d="M 75,32 C 75,32 102,72 102,92 C 102,107 90,119 75,119 C 60,119 48,107 48,92 C 48,72 75,32 75,32 Z" 
                                fill="url(#dropGrad)" opacity="0.2" filter="url(#glow-heavy)" />

                          {/* Main Droplet path */}
                          <path d="M 75,32 C 75,32 102,72 102,92 C 102,107 90,119 75,119 C 60,119 48,107 48,92 C 48,72 75,32 75,32 Z" 
                                fill="url(#dropGrad)" stroke="#10b981" strokeWidth="2.5" filter="url(#glow-heavy)"
                                style={{
                                  transition: 'transform 0.3s ease',
                                  cursor: 'pointer',
                                  filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.08)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                          />

                          {/* 3D Glass Highlights */}
                          <path d="M 62,80 A 13 13 0 0 1 71,69" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                          <circle cx="88" cy="98" r="2.5" fill="#ffffff" opacity="0.5" />
                        </svg>

                        <style>{`
                          @keyframes hydrantDropletSpin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                          }
                        `}</style>
                      </div>

                      <div style={{
                        position: 'absolute', bottom: 10, right: 10,
                        padding: '4px 10px', border: '1px solid #10b981', borderRadius: 6,
                        fontSize: 8, color: '#10b981', fontWeight: 800, letterSpacing: '0.08em',
                        background: 'rgba(16, 185, 129, 0.08)',
                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'pulse 1.5s infinite' }} />
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
                        value: node3?.water_pressure ?? 0,
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
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
