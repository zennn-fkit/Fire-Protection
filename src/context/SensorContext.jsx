import { createContext, useContext, useReducer, useCallback } from 'react';

// ── Initial State ─────────────────────────────────────────────
const initialState = {
  connected: false,
  lastUpdate: null,
  node1: null,
  node2: null,
  node3: null,
  node4: null,
  detectors: null,
  water_level: null,
  actuators: { SPRINKLER: 'OFF', ALARM: 'OFF', VALVE: 'CLOSED' },
  alerts: [],
  energyHistory: [],
  mockTickCount: 0,
  mockInitialized: false,
};

// ── Reducer ───────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };

    case 'SENSOR_UPDATE': {
      const d = action.payload;
      const now = new Date();
      const newState = { ...state, lastUpdate: now };

      if (d.node_id === 1) {
        newState.node1 = {
          voltage: d.voltage ?? (state.node1?.voltage ?? 220),
          current_amp: d.current_amp ?? (state.node1?.current_amp ?? 0),
          frequency: d.frequency ?? (state.node1?.frequency ?? 50),
          power_kw: d.power_kw ?? (state.node1?.power_kw ?? 0),
        };
        // Rolling energy history
        const newPoint = {
          time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          kw: d.power_kw ?? (state.node1?.power_kw ?? 0),
          voltage: d.voltage ?? (state.node1?.voltage ?? 220),
          amp: d.current_amp ?? (state.node1?.current_amp ?? 0),
          hz: d.frequency ?? (state.node1?.frequency ?? 50),
        };
        newState.energyHistory = [...(state.energyHistory || []).slice(-29), newPoint];
      }
      if (d.node_id === 2) {
        newState.node2 = {
          temperature: d.temperature ?? (state.node2?.temperature ?? 25),
          humidity: d.humidity ?? (state.node2?.humidity ?? 50),
        };
      }
      if (d.node_id === 3) {
        newState.node3 = {
          temperature: d.temperature ?? (state.node3?.temperature ?? 25),
          humidity: d.humidity ?? (state.node3?.humidity ?? 50),
        };
      }
      if (d.node_id === 4) {
        newState.node4 = {
          pressure: d.pressure ?? (state.node4?.pressure ?? 0),
          valve_status: d.valve_status ?? (state.node4?.valve_status ?? 'CLOSED'),
        };
      }
      if (d.smoke_status || d.flame_status || d.heat_status || d.thermal_status) {
        newState.detectors = {
          smoke: d.smoke_status ?? (state.detectors?.smoke ?? 'NORMAL'),
          flame: d.flame_status ?? (state.detectors?.flame ?? 'NORMAL'),
          heat: d.heat_status ?? (state.detectors?.heat ?? 'NORMAL'),
          thermal: d.thermal_status ?? (state.detectors?.thermal ?? 'NORMAL'),
        };
      }
      if (d.water_level != null) newState.water_level = d.water_level;
      if (d.actuators) newState.actuators = { ...state.actuators, ...d.actuators };

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

    case 'MOCK_TICK': {
      const now = new Date();
      if (!state.mockInitialized) {
        const tickCount = (state.mockTickCount || 0) + 1;
        if (tickCount < 2) {
          return { ...state, mockTickCount: tickCount, lastUpdate: now };
        }

        return {
          ...state,
          mockInitialized: true,
          lastUpdate: now,
          node1: { voltage: 220.5, current_amp: 150.2, frequency: 50.1, power_kw: 1.8 },
          node2: { temperature: 28.3, humidity: 54.2 },
          node3: { temperature: 30.1, humidity: 57.8 },
          node4: { pressure: 5.2, valve_status: 'CLOSED' },
          detectors: { smoke: 'NORMAL', flame: 'NORMAL', heat: 'NORMAL', thermal: 'NORMAL' },
          water_level: 78,
          energyHistory: Array.from({ length: 20 }, (_, i) => ({
            time: new Date(Date.now() - (19 - i) * 30000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            kw: +(1.4 + Math.random() * 0.8).toFixed(2),
            voltage: +(218 + Math.random() * 6).toFixed(1),
            amp: +(148 + Math.random() * 2).toFixed(1),
            hz: +(50 + Math.random() * 0.4).toFixed(2),
          }))
        };
      }

      const newPoint = {
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        kw: +(state.node1.power_kw + (Math.random() - 0.5) * 0.1).toFixed(2),
        voltage: +(state.node1.voltage + (Math.random() - 0.5) * 1).toFixed(1),
        amp: +(state.node1.current_amp + (Math.random() - 0.5) * 2).toFixed(1),
        hz: +(state.node1.frequency + (Math.random() - 0.5) * 0.4).toFixed(2),
      };
      return {
        ...state,
        lastUpdate: now,
        node1: {
          voltage: +(state.node1.voltage + (Math.random() - 0.5) * 1.5).toFixed(1),
          current_amp: +(state.node1.current_amp + (Math.random() - 0.5) * 2).toFixed(1),
          frequency: +(50 + (Math.random() - 0.5) * 0.4).toFixed(2),
          power_kw: +(state.node1.power_kw + (Math.random() - 0.5) * 0.1).toFixed(2),
        },
        node2: {
          temperature: +(state.node2.temperature + (Math.random() - 0.5) * 0.3).toFixed(1),
          humidity: +(state.node2.humidity + (Math.random() - 0.5) * 0.5).toFixed(1),
        },
        node3: {
          temperature: +(state.node3.temperature + (Math.random() - 0.5) * 0.3).toFixed(1),
          humidity: +(state.node3.humidity + (Math.random() - 0.5) * 0.5).toFixed(1),
        },
        node4: {
          ...state.node4,
          pressure: +(state.node4.pressure + (Math.random() - 0.5) * 0.1).toFixed(2),
        },
        water_level: +(state.water_level + (Math.random() - 0.5) * 0.2).toFixed(1),
        energyHistory: [...state.energyHistory.slice(-29), newPoint],
      };
    }

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────
const SensorContext = createContext(null);

export function SensorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const setConnected = useCallback(v => dispatch({ type: 'SET_CONNECTED', payload: v }), []);
  const sensorUpdate = useCallback(d => dispatch({ type: 'SENSOR_UPDATE', payload: d }), []);
  const alertNew = useCallback(d => dispatch({ type: 'ALERT_NEW', payload: d }), []);
  const controlUpdate = useCallback(d => dispatch({ type: 'CONTROL_UPDATE', payload: d }), []);
  const mockTick = useCallback(() => dispatch({ type: 'MOCK_TICK' }), []);

  return (
    <SensorContext.Provider value={{ state, setConnected, sensorUpdate, alertNew, controlUpdate, mockTick }}>
      {children}
    </SensorContext.Provider>
  );
}

export const useSensor = () => useContext(SensorContext);
