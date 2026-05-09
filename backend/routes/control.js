import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/control — Get all actuator states
router.get('/', async (req, res) => {
  try {
    const [states] = await pool.execute(
      'SELECT device, status, last_updated, triggered_by FROM actuator_state'
    );
    const [logs] = await pool.execute(
      'SELECT * FROM actuator_control ORDER BY timestamp DESC LIMIT 30'
    );
    res.json({
      states: Object.fromEntries(states.map(s => [s.device, s])),
      logs,
    });
  } catch (err) {
    console.error('GET /control error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/control — Manual control of an actuator
router.post('/', async (req, res) => {
  try {
    const io = req.app.get('io');
    const { device, status, operator = 'Operator' } = req.body;

    const validDevices  = ['SPRINKLER', 'ALARM', 'VALVE'];
    const validStatuses = ['ON', 'OFF', 'OPEN', 'CLOSED'];

    if (!validDevices.includes(device))  return res.status(400).json({ error: 'Invalid device' });
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await pool.execute(
      `UPDATE actuator_state SET status=?, triggered_by='MANUAL', last_updated=NOW() WHERE device=?`,
      [status, device]
    );

    await pool.execute(
      `INSERT INTO actuator_control (device, status, triggered_by, operator) VALUES (?, ?, 'MANUAL', ?)`,
      [device, status, operator]
    );

    const [updatedStates] = await pool.execute(
      'SELECT device, status, last_updated, triggered_by FROM actuator_state'
    );

    if (io) {
      io.emit('control:update', {
        device, status, triggered_by: 'MANUAL', operator,
        timestamp: new Date(),
        states: Object.fromEntries(updatedStates.map(s => [s.device, s])),
      });
    }

    res.json({ success: true, device, status });
  } catch (err) {
    console.error('POST /control error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
