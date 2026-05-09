import express from 'express';
import pool from '../config/db.js';
import { evaluateAutoControl } from '../utils/autoControl.js';

const router = express.Router();

// POST /api/sensor/data  — Orange Pi sends data here
router.post('/data', async (req, res) => {
  try {
    const io = req.app.get('io');
    const data = req.body;

    const {
      node_id,
      voltage, current_amp, frequency, power_kw,
      temperature, humidity,
      pressure, valve_status,
      smoke_status, flame_status, heat_status, thermal_status,
      water_level,
    } = data;

    if (!node_id) return res.status(400).json({ error: 'node_id is required' });

    // Insert reading
    const [result] = await pool.execute(
      `INSERT INTO sensor_readings
       (node_id, voltage, current_amp, frequency, power_kw, temperature, humidity,
        pressure, valve_status, smoke_status, flame_status, heat_status, thermal_status, water_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        node_id,
        voltage    ?? null, current_amp  ?? null, frequency ?? null, power_kw  ?? null,
        temperature ?? null, humidity    ?? null,
        pressure    ?? null, valve_status ?? null,
        smoke_status  ?? 'NORMAL', flame_status  ?? 'NORMAL',
        heat_status   ?? 'NORMAL', thermal_status ?? 'NORMAL',
        water_level   ?? null,
      ]
    );

    // Get current actuator states
    const [states] = await pool.execute('SELECT device, status FROM actuator_state');
    const currentStates = Object.fromEntries(states.map(s => [s.device, s.status]));

    // Evaluate auto-control
    const { actions, alerts } = evaluateAutoControl(data, currentStates);

    // Apply auto actions
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

    // Save alerts to DB and emit
    for (const alert of alerts) {
      await pool.execute(
        `INSERT INTO alert_logs (node_id, alert_type, severity, message, value, unit) VALUES (?, ?, ?, ?, ?, ?)`,
        [node_id, alert.alert_type, alert.severity, alert.message, alert.value ?? null, alert.unit ?? null]
      );
      if (io) io.emit('alert:new', { ...alert, timestamp: new Date(), node_id });
    }

    // Emit new sensor data to all connected clients
    if (io) {
      const [updatedStates] = await pool.execute('SELECT device, status FROM actuator_state');
      io.emit('sensor:update', {
        ...data,
        id: result.insertId,
        timestamp: new Date(),
        actuators: Object.fromEntries(updatedStates.map(s => [s.device, s.status])),
        autoActions: actions,
      });
    }

    res.json({ success: true, id: result.insertId, autoActions: actions });
  } catch (err) {
    console.error('POST /sensor/data error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensor/latest — Get latest reading per node
router.get('/latest', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.*
      FROM sensor_readings r
      INNER JOIN (
        SELECT node_id, MAX(id) AS max_id
        FROM sensor_readings
        GROUP BY node_id
      ) latest ON r.node_id = latest.node_id AND r.id = latest.max_id
      ORDER BY r.node_id
    `);

    const [states] = await pool.execute('SELECT device, status, last_updated, triggered_by FROM actuator_state');
    const [waterRows] = await pool.execute(
      'SELECT * FROM water_usage ORDER BY date DESC LIMIT 5'
    );

    res.json({
      nodes: rows,
      actuators: Object.fromEntries(states.map(s => [s.device, { status: s.status, last_updated: s.last_updated, triggered_by: s.triggered_by }])),
      water_usage: waterRows,
    });
  } catch (err) {
    console.error('GET /sensor/latest error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
