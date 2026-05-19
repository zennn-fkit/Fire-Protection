// Sensor value thresholds for color/status determination
export const THRESHOLDS = {
  voltage:         { min: 200, max: 240, warn_lo: 210, warn_hi: 245 },
  current_amp:     { min: 0,   max: 180, warn_hi: 150, danger_hi: 165 },
  frequency:       { min: 45,  max: 55,  warn_lo: 49,  warn_hi: 51 },
  power_kw:        { min: 0,   max: 4000,   warn_hi: 2000, danger_hi: 3000 },
  energy_kwh:      { min: 0,   max: 10000 },
  temperature:     { min: 0,   max: 90,  warn_hi: 40,  danger_hi: 60 },
  temperature_sht: { min: 0,   max: 90,  warn_hi: 40,  danger_hi: 60 },
  thermal_temp:    { min: 0,   max: 90,  warn_hi: 60,  danger_hi: 60 },
  humidity:        { min: 0,   max: 100, warn_lo: 20,  warn_hi: 80 },
  pressure:        { min: 0,   max: 12,  warn_lo: 10,   danger_lo: 6 },
  water_level:     { min: 0,   max: 100, warn_lo: 30,  danger_lo: 10 },
  co2_ppm:         { min: 0,   max: 2,   warn_hi: 1,   danger_hi: 1.5 },
  uv_detected:     { min: 0,   max: 1 },
};

/**
 * Get status string for a value based on thresholds
 * @returns {'normal'|'warning'|'danger'}
 */
export function getStatus(key, value) {
  const t = THRESHOLDS[key];
  if (!t) return 'normal';

  if (t.danger_hi && value >= t.danger_hi) return 'danger';
  if (t.danger_lo && value <= t.danger_lo) return 'danger';
  if (t.warn_hi   && value >= t.warn_hi)   return 'warning';
  if (t.warn_lo   && value <= t.warn_lo)   return 'warning';
  return 'normal';
}

/** Map status string to palette from design system */
export const STATUS_COLORS = {
  normal:  { text: '#10B981', bg: 'rgba(16,185,129,0.12)',  stroke: '#10B981', label: 'Normal'  },
  warning: { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  stroke: '#f59e0b', label: 'Warning' },
  danger:  { text: '#f87171', bg: 'rgba(248,113,113,0.12)', stroke: '#f87171', label: 'Bahaya'  },
};

/** Get color for a gauge based on value and thresholds */
export function getGaugeColor(key, value) {
  const status = getStatus(key, value);
  return STATUS_COLORS[status].stroke;
}
