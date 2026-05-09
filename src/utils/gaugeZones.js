// Gauge zone color definitions (separated to avoid Vite Fast Refresh issues)

// Default zone: emerald (low) → amber (mid) → coral red (high)
export const ZONE_DEFAULT = [
  { s: 0, e: 0.6, color: '#10B981' },
  { s: 0.6, e: 0.8, color: '#f59e0b' },
  { s: 0.8, e: 1.0, color: '#f87171' },
];

// Voltage zone: danger at BOTH ends, normal in middle
export const ZONE_VOLTAGE = [
  { s: 0, e: 0.25, color: '#f87171' }, // < 200V  danger
  { s: 0.25, e: 0.375, color: '#f59e0b' }, // 200-210V warning
  { s: 0.375, e: 0.625, color: '#10B981' }, // 210-230V normal
  { s: 0.625, e: 0.75, color: '#f59e0b' }, // 230-240V warning
  { s: 0.75, e: 1.0, color: '#f87171' }, // > 240V  danger
];

// Frequency zone: warning at BOTH ends, normal in middle
export const ZONE_FREQUENCY = [
  { s: 0, e: 0.4, color: '#f59e0b' }, // 45-49Hz warning
  { s: 0.4, e: 0.6, color: '#10B981' }, // 49-51Hz normal
  { s: 0.6, e: 1.0, color: '#f59e0b' }, // 51-55Hz warning
];
