import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mqtt from 'mqtt';
import cron from 'node-cron';
import pool from './config/db.js';
import { evaluateAutoControl } from './utils/autoControl.js';

import sensorRoutes     from './routes/sensor.js';
import historyRoutes   from './routes/history.js';
import alertRoutes     from './routes/alerts.js';
import controlRoutes   from './routes/control.js';
import waterUsageRoutes, { calcVolume } from './routes/waterUsage.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const TANK_CONFIG_PATH = join(__dirname, './config/tankConfig.json');

function readTankConfig() {
  try { return JSON.parse(readFileSync(TANK_CONFIG_PATH, 'utf8')); }
  catch { return { shape: 'cylinder', maxDistanceCm: 200, cylinder: { diameterCm: 120 }, rectangle: { lengthCm: 150, widthCm: 100 } }; }
}

dotenv.config();

const FIRE_TEMP_WARNING = 40;
const FIRE_TEMP_DANGER = 60;
const GAS_WARNING = 1;
const GAS_DANGER = 1.5;

const STATUS_ALIASES = {
  NORMAL: 'NORMAL',
  AMAN: 'NORMAL',
  OK: 'NORMAL',
  SAFE: 'NORMAL',
  WARNING: 'WARNING',
  WARN: 'WARNING',
  WASPADA: 'WARNING',
  DANGER: 'DANGER',
  BAHAYA: 'DANGER',
  CRITICAL: 'DANGER',
};

function normalizeStatus(status) {
  if (status == null) return null;
  return STATUS_ALIASES[String(status).trim().toUpperCase()] ?? null;
}

function thresholdStatus(value, warning, danger) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  if (numberValue >= danger) return 'DANGER';
  if (numberValue >= warning) return 'WARNING';
  return 'NORMAL';
}

function binaryStatus(value) {
  if (value == null) return null;
  const normalized = normalizeStatus(value);
  if (normalized) return normalized;
  return Number(value) === 1 ? 'DANGER' : 'NORMAL';
}

const app    = express();
const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────
const io = new SocketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// ── MQTT Client ────────────────────────────────────────────────
const mqttClient = mqtt.connect('mqtt://broker.emqx.io');

mqttClient.on('connect', () => {
  console.log('🌐 Connected to MQTT Broker (broker.emqx.io)');
  mqttClient.subscribe(['projek_orange_pi/sensor/master', 'projek_orange_pi/sensor/env'], (err) => {
    if (!err) {
      console.log('📡 Subscribed to MQTT topics: projek_orange_pi/sensor/master & projek_orange_pi/sensor/env');
    } else {
      console.error('❌ MQTT Subscribe error:', err);
    }
  });
});

// ── Cache Data Sensor ──────────────────────────────────────────
let latestSensorData = {
  ac_voltage: null,
  current_amp: null,
  frequency: null,
  power_kw: null,
  energy_kwh: null,      // ✅ Akumulasi energi listrik dari PZEM-004T
  temperature_sht: null,
  humidity: null,
  pressure: null,
  water_pressure: null,
  mq7_ppm: null,
  co2_ppm: null,
  max_temp: null,
  thermal_temp: null,
  uv_detected: null,
  smoke_status: 'NORMAL',
  flame_status: 'NORMAL',
  heat_status: 'NORMAL',
  thermal_status: 'NORMAL',
  water_level: null,
  valve_status: 'CLOSED'
};

mqttClient.on('message', async (topic, message) => {
  // ── 1. Parse JSON dulu — jika gagal, abaikan pesan ini ──
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (parseErr) {
    console.error('❌ MQTT JSON parse error:', parseErr.message);
    return;
  }

  if (topic === 'projek_orange_pi/sensor/master') {
    data.node_id = 'master';
  } else if (topic === 'projek_orange_pi/sensor/env') {
    data.node_id = 'env';
  } else {
    data.node_id = 'unknown';
  }

  // Merge incoming data into global cache
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      latestSensorData[key] = data[key];
    }
  });

  let emitPayload = { ...data };

  // ── 2. Remap field khusus jika dari topik master ──
  if (topic === 'projek_orange_pi/sensor/master') {
    emitPayload = {
      ...emitPayload,
      sensor_voltage:  data.voltage  ?? null,   // simpan sebagai sensor_voltage
      gas_pressure:    data.pressure ?? null,   // tampilkan di gauge tekanan gas
      gas_valve:       data.valve_status ?? null, // status katup gas
      valve_status_hw: data.valve_status ?? null, // status katup dari hardware
      voltage:         undefined,               // hapus agar tidak mengisi gauge tegangan AC
    };
  } else if (topic === 'projek_orange_pi/sensor/env') {
    // Topik env mengirimkan ac_voltage untuk tegangan listrik
    emitPayload = {
      ...emitPayload,
      voltage: data.ac_voltage ?? null,
    };
  }

  // Hapus key undefined agar tidak terkirim ke frontend
  Object.keys(emitPayload).forEach(k => emitPayload[k] === undefined && delete emitPayload[k]);

  // ── 3. Coba simpan ke DB & evaluasi auto-control ──
  let dbResult = null;
  let autoActions = [];
  let updatedActuators = {};
  let normalizedStatuses = {};

  try {
    const {
      current_amp, frequency, power_kw, energy_kwh,
      temperature_sht, humidity,
      pressure, water_level, water_pressure,
      mq7_ppm, co2_ppm, max_temp, thermal_temp, uv_detected,
      smoke_status, flame_status, heat_status, thermal_status,
      ac_voltage, valve_status
    } = latestSensorData; // Gunakan data gabungan dari cache

    let dbValveStatus = 'CLOSED';
    if (valve_status === 'TERBUKA' || valve_status === 'OPEN') dbValveStatus = 'OPEN';

    const effectiveSmokeStatus =
      thresholdStatus(mq7_ppm ?? co2_ppm, GAS_WARNING, GAS_DANGER) ??
      normalizeStatus(smoke_status) ??
      'NORMAL';
    const effectiveFlameStatus =
      binaryStatus(uv_detected ?? 0) ??
      normalizeStatus(flame_status) ??
      'NORMAL';
    const effectiveHeatStatus =
      thresholdStatus(temperature_sht, FIRE_TEMP_WARNING, FIRE_TEMP_DANGER) ??
      normalizeStatus(heat_status) ??
      'NORMAL';
    const effectiveThermalStatus =
      thresholdStatus(max_temp ?? thermal_temp, FIRE_TEMP_WARNING, FIRE_TEMP_DANGER) ??
      normalizeStatus(thermal_status) ??
      'NORMAL';

    const normalizedData = {
      ...data,
      smoke_status: effectiveSmokeStatus,
      flame_status: effectiveFlameStatus,
      heat_status: effectiveHeatStatus,
      thermal_status: effectiveThermalStatus,
    };
    normalizedStatuses = {
      smoke_status: effectiveSmokeStatus,
      flame_status: effectiveFlameStatus,
      heat_status: effectiveHeatStatus,
      thermal_status: effectiveThermalStatus,
    };

    const [result] = await pool.execute(
      `INSERT INTO sensor_readings
       (node_id, voltage, current_amp, frequency, power_kw, energy_kwh, temperature, humidity,
        pressure, water_pressure, co2_ppm, thermal_temp, smoke_status, flame_status, heat_status, thermal_status, water_level, valve_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        ac_voltage ?? null, current_amp ?? null, frequency ?? null, power_kw ?? null,
        energy_kwh ?? null,
        temperature_sht ?? null, humidity ?? null,
        pressure ?? null, water_pressure ?? null,
        mq7_ppm ?? co2_ppm ?? null, max_temp ?? thermal_temp ?? null,
        effectiveSmokeStatus,
        effectiveFlameStatus,
        effectiveHeatStatus,
        effectiveThermalStatus,
        water_level ?? null,
        dbValveStatus
      ]
    );
    dbResult = result;

    const [states] = await pool.execute('SELECT device, status FROM actuator_state');
    const currentStates = Object.fromEntries(states.map(s => [s.device, s.status]));
    const { actions, alerts } = evaluateAutoControl(normalizedData, currentStates);
    autoActions = actions;

    for (const action of actions) {
      await pool.execute(
        `UPDATE actuator_state SET status=?, triggered_by='AUTO', last_updated=NOW() WHERE device=?`,
        [action.status, action.device]
      );
      await pool.execute(
        `INSERT INTO actuator_control (device, status, triggered_by, reason) VALUES (?, ?, 'AUTO', ?)`,
        [action.device, action.status, action.reason]
      );
    }

    for (const alert of alerts) {
      await pool.execute(
        `INSERT INTO alert_logs (node_id, alert_type, severity, message, value, unit) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, alert.alert_type, alert.severity, alert.message, alert.value ?? null, alert.unit ?? null]
      );
      io.emit('alert:new', { ...alert, timestamp: new Date(), node_id: 'master' });
    }

    const [updatedStates] = await pool.execute('SELECT device, status FROM actuator_state');
    updatedActuators = Object.fromEntries(updatedStates.map(s => [s.device, s.status]));

    if (topic === 'projek_orange_pi/sensor/master') {
      console.log(`📥 MQTT MASTER data saved — pressure: ${data.pressure}, valve: ${data.valve_status}`);
    } else if (topic === 'projek_orange_pi/sensor/env') {
      console.log(`📥 MQTT ENV data saved — temp: ${data.temperature_sht}C, voltage: ${data.ac_voltage}V, mq7: ${data.mq7_ppm}ppm`);
    }
  } catch (dbErr) {
    // ⚠️ DB gagal, tapi jangan blokir UI — tetap kirim data ke frontend
    console.error('⚠️  MQTT DB error (data tetap diteruskan ke UI):', dbErr.message);
  }

  // ── 4. Selalu emit ke frontend — baik DB sukses maupun gagal ──
  io.emit('sensor:update', {
    ...emitPayload,
    ...normalizedStatuses,
    id:          dbResult?.insertId ?? null,
    timestamp:   new Date(),
    actuators:   updatedActuators,
    autoActions: autoActions,
  });
});

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/sensor',      sensorRoutes);
app.use('/api/history',     historyRoutes);
app.use('/api/alerts',      alertRoutes);
app.use('/api/control',     controlRoutes);
app.use('/api/water-usage', waterUsageRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'OK', time: new Date() }));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Cron Job: Snapshot volume air setiap tengah malam ────────
// Format: '0 0 * * *' = jam 00:00 setiap hari
cron.schedule('0 0 * * *', async () => {
  try {
    const cfg   = readTankConfig();
    const dist  = latestSensorData.water_distance;   // jarak sensor (cm)
    const maxDist = cfg.maxDistanceCm || 200;
    const waterLevelCm = dist != null ? Math.max(0, maxDist - dist) : null;
    const volume = calcVolume(waterLevelCm, cfg);
    const today  = new Date().toISOString().slice(0, 10);

    await pool.execute(
      `INSERT INTO water_usage (date, volume_m3, status)
       VALUES (?, ?, 'SAVED')
       ON DUPLICATE KEY UPDATE volume_m3 = ?, status = 'SAVED'`,
      [today, volume, volume]
    );
    console.log(`🕛 [CRON] water_usage snapshot: ${today} → ${volume} m³ (level: ${waterLevelCm?.toFixed(1)} cm)`);
  } catch (err) {
    console.error('🕛 [CRON] water_usage error:', err.message);
  }
}, { timezone: 'Asia/Jakarta' });

// ── Start Server ─────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;
server.listen(PORT, () => {
  console.log(`\n🔥 Smart Fire Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`📋 API Endpoints:`);
  console.log(`   POST  /api/sensor/data       — Receive sensor data from Orange Pi`);
  console.log(`   GET   /api/sensor/latest     — Latest readings`);
  console.log(`   GET   /api/history           — Historical data`);
  console.log(`   GET   /api/alerts            — Alert logs`);
  console.log(`   GET   /api/control           — Actuator states`);
  console.log(`   POST  /api/control           — Manual control`);
  console.log(`   GET   /api/water-usage       — Water usage (7 hari terakhir)`);
  console.log(`   GET   /api/water-usage/config — Tank config`);
  console.log(`   POST  /api/water-usage/config — Save tank config`);
  console.log(`🕛 Cron job aktif: snapshot volume air setiap tengah malam WIB\n`);
});
