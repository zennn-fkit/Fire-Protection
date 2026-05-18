import { createContext, useContext, useReducer, useCallback } from 'react';

// ── Helpers ───────────────────────────────────────────────────
// Durasi timeout (ms): jika tidak ada data real dalam waktu ini, kembali ke mock
const REAL_TIMEOUT_MS = 15000;

function isFresh(timestamps, key) {
  const ts = timestamps?.[key];
  return ts && (Date.now() - ts) < REAL_TIMEOUT_MS;
}

// ── Initial State ─────────────────────────────────────────────
const initialState = {
  connected: false,
  lastUpdate: null,
  // Sensor data
  panelData: null,
  node3: null,
  node4: null,
  detectors: null,
  water_level: null,
  water_pressure: null,     // Bar  — pressure transducer
  water_distance: null,     // cm   — ultrasonik HC-SR04 (jarak dari sensor ke permukaan air)
  // Actuators & alerts
  actuators: { SPRINKLER: 'OFF', ALARM: 'OFF', VALVE: 'CLOSED' },
  alerts: [],
  energyHistory: [],
  // Mock internals
  mockTickCount: 0,
  mockInitialized: false,
  // Timestamps kapan terakhir masing-masing field mendapat data REAL dari sensor
  // Struktur: { master: number, node3: number, node4: number, detectors: number,
  //             water_level: number, water_pressure: number, water_distance: number }
  realDataTimestamps: {},
};

// ── Reducer ───────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };

    // ── Real sensor data arriving from backend via Socket.io ──
    case 'SENSOR_UPDATE': {
      const d = action.payload;
      const now = new Date();
      const nowMs = now.getTime();
      const newState = { ...state, lastUpdate: now };
      const rts = { ...state.realDataTimestamps };

      if (d.node_id === 'master' || d.node_id === 'env') {
        rts.master = nowMs;
        // Update panelData.voltage dari data sensor
        const incomingVoltage = d.voltage;
        const isRealACVoltage = incomingVoltage != null; // Terima semua nilai, termasuk 0V

        // Pemetaan untuk sensor baru (env)
        const newThermalTemp = d.max_temp ?? d.thermal_temp;
        const newCo2Ppm = d.mq7_ppm ?? d.co2_ppm;
        let newUvDetected = state.panelData?.uv_detected ?? 0;
        if (d.flame_status) {
          newUvDetected = d.flame_status === 'DANGER' ? 1 : 0;
        } else if (d.uv_detected !== undefined) {
          newUvDetected = d.uv_detected;
        }

        newState.panelData = {
          voltage:         isRealACVoltage ? incomingVoltage : (state.panelData?.voltage ?? 220),
          current_amp:     d.current_amp     ?? (state.panelData?.current_amp     ?? 0),
          power_kw:        d.power_kw        ?? (state.panelData?.power_kw        ?? 0),
          energy_kwh:      d.energy_kwh      ?? (state.panelData?.energy_kwh      ?? 0),
          temperature_sht: d.temperature_sht ?? (state.panelData?.temperature_sht ?? 25),
          humidity:        d.humidity        ?? (state.panelData?.humidity        ?? 50),
          thermal_temp:    newThermalTemp    ?? (state.panelData?.thermal_temp    ?? 25),
          co2_ppm:         newCo2Ppm         ?? (state.panelData?.co2_ppm         ?? 0),
          uv_detected:     newUvDetected,
          // Simpan tegangan output sensor (0-10V) terpisah untuk keperluan debugging
          sensor_voltage:  d.sensor_voltage  ?? (state.panelData?.sensor_voltage  ?? null),
          frequency:       d.frequency       ?? (state.panelData?.frequency       ?? 50),
          gas_pressure:    d.gas_pressure    ?? (state.panelData?.gas_pressure    ?? 0),
          gas_valve:       d.gas_valve       ?? (state.panelData?.gas_valve       ?? 'CLOSED'),
        };
        const newPoint = {
          time:    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          kw:      d.power_kw     ?? (state.panelData?.power_kw     ?? 0),
          voltage: isRealACVoltage ? incomingVoltage : (state.panelData?.voltage ?? 220),
          amp:     d.current_amp  ?? (state.panelData?.current_amp  ?? 0),
          hz:      50,
        };
        newState.energyHistory = [...(state.energyHistory || []).slice(-29), newPoint];
      }
      if (d.node_id === 3) {
        rts.node3 = nowMs;
        newState.node3 = {
          temperature: d.temperature ?? (state.node3?.temperature ?? 25),
          humidity:    d.humidity    ?? (state.node3?.humidity    ?? 50),
        };
      }
      if (d.node_id === 4) {
        rts.node4 = nowMs;
        newState.node4 = {
          pressure:     d.pressure     ?? (state.node4?.pressure     ?? 0),
          valve_status: d.valve_status ?? (state.node4?.valve_status ?? 'CLOSED'),
        };
      }
      if (d.smoke_status || d.flame_status || d.heat_status || d.thermal_status) {
        rts.detectors = nowMs;
        newState.detectors = {
          smoke:   d.smoke_status   ?? (state.detectors?.smoke   ?? 'NORMAL'),
          flame:   d.flame_status   ?? (state.detectors?.flame   ?? 'NORMAL'),
          heat:    d.heat_status    ?? (state.detectors?.heat    ?? 'NORMAL'),
          thermal: d.thermal_status ?? (state.detectors?.thermal ?? 'NORMAL'),
        };
      }
      if (d.water_level    != null) { rts.water_level    = nowMs; newState.water_level    = d.water_level; }
      // Terima water_pressure dari field asli
      if (d.water_pressure != null) {
        rts.water_pressure = nowMs;
        newState.water_pressure = d.water_pressure;
      }
      if (d.water_distance != null)   { rts.water_distance = nowMs; newState.water_distance = d.water_distance; }
      // Status katup dari hardware ESP32 (valve_status_hw)
      if (d.valve_status_hw != null) {
        // Update actuators state
        newState.actuators = {
          ...state.actuators,
          VALVE: d.valve_status_hw === 'TERBUKA' ? 'OPEN' : 'CLOSED',
        };
      }
      if (d.actuators) newState.actuators = { ...state.actuators, ...d.actuators };

      newState.realDataTimestamps = rts;
      return newState;
    }

    case 'ALERT_NEW':
      return { ...state, alerts: [action.payload, ...state.alerts].slice(0, 50) };

    case 'CONTROL_UPDATE':
      return {
        ...state,
        actuators: action.payload.states
          ? Object.fromEntries(Object.entries(action.payload.states).map(([k, v]) => [k, v.status]))
          : { ...state.actuators, [action.payload.device]: action.payload.status },
      };

    // ── Mock tick: jalan terus tiap 3 detik, tapi skip field yang punya data real fresh ──
    case 'MOCK_TICK': {
      const now = new Date();
      const rts = state.realDataTimestamps || {};

      // ── FASE 1: Inisialisasi awal (2 tick pertama hanya counter) ──
      if (!state.mockInitialized) {
        const tickCount = (state.mockTickCount || 0) + 1;
        if (tickCount < 2) {
          return { ...state, mockTickCount: tickCount, lastUpdate: now };
        }
        // Tick ke-2: langsung inisialisasi semua nilai mock awal
        return {
          ...state,
          mockInitialized: true,
          lastUpdate: now,
          // Hanya inisialisasi field yang belum dapat data real
          panelData: isFresh(rts, 'master') ? state.panelData : {
            voltage: 220.5, current_amp: 150.2, power_kw: 1.8, energy_kwh: 1245.5,
            temperature_sht: 28.35, humidity: 54.2, thermal_temp: 27.2, co2_ppm: 0.014, uv_detected: 0,
            gas_pressure: 5.2, gas_valve: 'CLOSED',
          },
          node3: isFresh(rts, 'node3') ? state.node3
            : { temperature: 30.1, humidity: 57.8 },
          node4: isFresh(rts, 'node4') ? state.node4
            : { pressure: 5.2, valve_status: 'CLOSED' },
          detectors: isFresh(rts, 'detectors') ? state.detectors
            : { smoke: 'NORMAL', flame: 'NORMAL', heat: 'NORMAL', thermal: 'NORMAL' },
          water_level: isFresh(rts, 'water_level') ? state.water_level : 78,
          water_pressure: isFresh(rts, 'water_pressure') ? state.water_pressure : 4.8,
          water_distance: isFresh(rts, 'water_distance') ? state.water_distance : 62.0,
          energyHistory: isFresh(rts, 'master') ? state.energyHistory : Array.from({ length: 20 }, (_, i) => ({
            time: new Date(Date.now() - (19 - i) * 30000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            kw:      +(1.4 + Math.random() * 0.8).toFixed(2),
            voltage: +(218 + Math.random() * 6).toFixed(1),
            amp:     +(148 + Math.random() * 2).toFixed(1),
            hz:      +(50  + Math.random() * 0.4).toFixed(2),
          })),
        };
      }

      // ── FASE 2: Update berkala — skip field yang data real-nya masih segar ──
      const nextState = { ...state, lastUpdate: now };

      // panelData + energyHistory (sumber: master node)
      if (!isFresh(rts, 'master') && state.panelData) {
        const newPoint = {
          time:    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          kw:      +(state.panelData.power_kw    + (Math.random() - 0.5) * 0.1).toFixed(2),
          voltage: +(state.panelData.voltage     + (Math.random() - 0.5) * 1).toFixed(1),
          amp:     +(state.panelData.current_amp + (Math.random() - 0.5) * 2).toFixed(1),
          hz:      50,
        };
        nextState.panelData = {
          voltage:         +(state.panelData.voltage         + (Math.random() - 0.5) * 1.5).toFixed(1),
          current_amp:     +(state.panelData.current_amp     + (Math.random() - 0.5) * 2).toFixed(1),
          power_kw:        +(state.panelData.power_kw        + (Math.random() - 0.5) * 0.1).toFixed(2),
          energy_kwh:      +(state.panelData.energy_kwh      + 0.01).toFixed(2),
          temperature_sht: +(state.panelData.temperature_sht + (Math.random() - 0.5) * 0.1).toFixed(2),
          humidity:        +(state.panelData.humidity        + (Math.random() - 0.5) * 0.5).toFixed(1),
          thermal_temp:    +(state.panelData.thermal_temp    + (Math.random() - 0.5) * 0.1).toFixed(1),
          co2_ppm:         +(Math.max(0, state.panelData.co2_ppm + (Math.random() - 0.5) * 0.002)).toFixed(3),
          uv_detected:     Math.random() > 0.95
            ? (state.panelData.uv_detected === 1 ? 0 : 1)
            : state.panelData.uv_detected,
          gas_pressure:    +(Math.max(0, (state.panelData.gas_pressure || 0) + (Math.random() - 0.5) * 0.5)).toFixed(2),
          gas_valve:       state.panelData.gas_valve || 'CLOSED',
        };
        nextState.energyHistory = [...state.energyHistory.slice(-29), newPoint];
      }

      // node3 (suhu & kelembaban ruangan)
      if (!isFresh(rts, 'node3') && state.node3) {
        nextState.node3 = {
          temperature: +(state.node3.temperature + (Math.random() - 0.5) * 0.3).toFixed(1),
          humidity:    +(state.node3.humidity    + (Math.random() - 0.5) * 0.5).toFixed(1),
        };
      }

      // node4 (pressure hydrant jaringan pipa)
      if (!isFresh(rts, 'node4') && state.node4) {
        nextState.node4 = {
          ...state.node4,
          pressure: +(state.node4.pressure + (Math.random() - 0.5) * 0.1).toFixed(2),
        };
      }

      // water_level (persentase tangki)
      if (!isFresh(rts, 'water_level') && state.water_level != null) {
        nextState.water_level = +(
          Math.max(0, Math.min(100, state.water_level + (Math.random() - 0.5) * 0.3))
        ).toFixed(1);
      }

      // water_pressure (pressure transducer — Bar)
      if (!isFresh(rts, 'water_pressure') && state.water_pressure != null) {
        nextState.water_pressure = +(
          Math.max(0, Math.min(10, state.water_pressure + (Math.random() - 0.5) * 0.12))
        ).toFixed(2);
      }

      // water_distance (ultrasonik — cm dari sensor ke air)
      if (!isFresh(rts, 'water_distance') && state.water_distance != null) {
        nextState.water_distance = +(
          Math.max(0, Math.min(200, state.water_distance + (Math.random() - 0.5) * 0.4))
        ).toFixed(1);
      }

      return nextState;
    }

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────
const SensorContext = createContext(null);

export function SensorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const setConnected  = useCallback(v => dispatch({ type: 'SET_CONNECTED',  payload: v }), []);
  const sensorUpdate  = useCallback(d => dispatch({ type: 'SENSOR_UPDATE',  payload: d }), []);
  const alertNew      = useCallback(d => dispatch({ type: 'ALERT_NEW',      payload: d }), []);
  const controlUpdate = useCallback(d => dispatch({ type: 'CONTROL_UPDATE', payload: d }), []);
  const mockTick      = useCallback(() => dispatch({ type: 'MOCK_TICK' }), []);

  return (
    <SensorContext.Provider value={{ state, setConnected, sensorUpdate, alertNew, controlUpdate, mockTick }}>
      {children}
    </SensorContext.Provider>
  );
}

export const useSensor = () => useContext(SensorContext);
