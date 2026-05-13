import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mqtt from 'mqtt';
import pool from './config/db.js';
import { evaluateAutoControl } from './utils/autoControl.js';

import sensorRoutes  from './routes/sensor.js';
import historyRoutes from './routes/history.js';
import alertRoutes   from './routes/alerts.js';
import controlRoutes from './routes/control.js';

dotenv.config();

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
  mqttClient.subscribe('projek_orange_pi/sensor/master', (err) => {
    if (!err) {
      console.log('📡 Subscribed to MQTT topic: projek_orange_pi/sensor/master');
    } else {
      console.error('❌ MQTT Subscribe error:', err);
    }
  });
});

mqttClient.on('message', async (topic, message) => {
  // ── 1. Parse JSON dulu — jika gagal, abaikan pesan ini ──
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (parseErr) {
    console.error('❌ MQTT JSON parse error:', parseErr.message);
    return;
  }

  data.node_id = 'master';

  // ── 2. Remap field sensor tekanan ke nama yang dikenal UI ──
  // Sensor Sonseiko (pressure transducer 0-25Bar, output 0-10V via INA226):
  //   - data.voltage   = tegangan output sensor (0-10V) — BUKAN tegangan listrik AC
  //   - data.pressure  = tekanan dihitung (0-250 unit)
  // Kita remap agar tidak merusak gauge tegangan listrik (180-260V AC) di dashboard.
  const emitPayload = {
    ...data,
    sensor_voltage:  data.voltage  ?? null,   // simpan sebagai sensor_voltage
    water_pressure:  data.pressure ?? null,   // tampilkan di gauge tekanan air
    valve_status_hw: data.valve_status ?? null, // status katup dari hardware
    voltage:         undefined,               // hapus agar tidak mengisi gauge tegangan AC
  };
  // Hapus key undefined agar tidak terkirim ke frontend
  Object.keys(emitPayload).forEach(k => emitPayload[k] === undefined && delete emitPayload[k]);

  // ── 3. Coba simpan ke DB & evaluasi auto-control ──
  let dbResult = null;
  let autoActions = [];
  let updatedActuators = {};

  try {
    const {
      current_amp, frequency, power_kw,
      temperature_sht, humidity,
      pressure, water_level,
      smoke_status, flame_status, heat_status, thermal_status,
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO sensor_readings
       (node_id, voltage, current_amp, frequency, power_kw, temperature, humidity,
        pressure, smoke_status, flame_status, heat_status, thermal_status, water_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        null, current_amp ?? null, frequency ?? null, power_kw ?? null,
        temperature_sht ?? null, humidity ?? null,
        pressure ?? null,
        smoke_status ?? 'NORMAL', flame_status ?? 'NORMAL',
        heat_status ?? 'NORMAL', thermal_status ?? 'NORMAL',
        water_level ?? null,
      ]
    );
    dbResult = result;

    const [states] = await pool.execute('SELECT device, status FROM actuator_state');
    const currentStates = Object.fromEntries(states.map(s => [s.device, s.status]));
    const { actions, alerts } = evaluateAutoControl(data, currentStates);
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

    console.log(`📥 MQTT data received & saved — pressure: ${data.pressure}, valve: ${data.valve_status}`);
  } catch (dbErr) {
    // ⚠️ DB gagal, tapi jangan blokir UI — tetap kirim data ke frontend
    console.error('⚠️  MQTT DB error (data tetap diteruskan ke UI):', dbErr.message);
  }

  // ── 4. Selalu emit ke frontend — baik DB sukses maupun gagal ──
  io.emit('sensor:update', {
    ...emitPayload,
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
app.use('/api/sensor',  sensorRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/alerts',  alertRoutes);
app.use('/api/control', controlRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'OK', time: new Date() }));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Start Server ─────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;
server.listen(PORT, () => {
  console.log(`\n🔥 Smart Fire Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`📋 API Endpoints:`);
  console.log(`   POST  /api/sensor/data    — Receive sensor data from Orange Pi`);
  console.log(`   GET   /api/sensor/latest  — Latest readings`);
  console.log(`   GET   /api/history        — Historical data`);
  console.log(`   GET   /api/alerts         — Alert logs`);
  console.log(`   GET   /api/control        — Actuator states`);
  console.log(`   POST  /api/control        — Manual control\n`);
});
