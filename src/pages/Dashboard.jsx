
import { motion, AnimatePresence } from 'framer-motion';
import { ZONE_DEFAULT, ZONE_VOLTAGE } from '../utils/gaugeZones';
import { useSensor } from '../context/SensorContext';
import GaugeCard from '../components/dashboard/GaugeCard';
import MonitoringRealtimePanel from '../components/dashboard/MonitoringRealtimePanel';
import SensorStatusCard from '../components/dashboard/SensorStatusCard';
import Header from '../components/layout/Header';

// Framer Motion variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const alertVariants = {
  initial: { opacity: 0, height: 0, scale: 0.95 },
  animate: {
    opacity: 1, height: 'auto', scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, height: 0, scale: 0.95,
    transition: { duration: 0.3 },
  },
};

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

  const gauges = panelData ? [
    { label: 'Tegangan', value: panelData.voltage, min: 180, max: 260, unit: 'Volt AC', threshKey: 'voltage', decimals: 1, zones: ZONE_VOLTAGE },
    { label: 'Arus', value: panelData.current_amp, min: 0, max: 180, unit: 'Ampere', threshKey: 'current_amp', decimals: 1, zones: ZONE_DEFAULT },
    { label: 'Watt', value: panelData.power_kw * 1000, min: 0, max: 3000, unit: 'Watt', threshKey: 'power_kw', decimals: 0, zones: ZONE_DEFAULT },
    { label: 'Energy', value: panelData.energy_kwh, min: 0, max: 10000, unit: 'kWh', threshKey: 'energy_kwh', decimals: 2, zones: ZONE_DEFAULT },
  ] : [];

  return (
    <div className="page-gradient">
      <Header title="Monitoring Sensor" />

      <AnimatePresence>
        {anyDanger && (
          <motion.div
            variants={alertVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              margin: '16px 28px 0', padding: '12px 20px', borderRadius: 12,
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)',
              display: 'flex', alignItems: 'center', gap: 10,
              animation: 'danger-pulse 2s ease-in-out infinite',
            }}>
            <span style={{ fontSize: 20 }}>🚨</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
              BAHAYA KEBAKARAN TERDETEKSI! Harap segera ambil tindakan!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {gauges.map((g, i) => (
            <motion.div key={g.label} variants={cardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <GaugeCard {...g} />
            </motion.div>
          ))}
        </div>

        <motion.div variants={cardVariants}>
          <MonitoringRealtimePanel
            energyHistory={energyHistory}
            waterDistance={water_distance}
            maxTankCm={MAX_TANK_CM}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
