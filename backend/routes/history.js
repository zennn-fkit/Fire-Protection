import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/history?node_id=&from=&to=&limit=&page=
router.get('/', async (req, res) => {
  try {
    const { node_id, from, to, limit = 100, page = 1 } = req.query;
    const conditions = [];
    const params     = [];

    if (node_id) { conditions.push('node_id = ?'); params.push(node_id); }
    if (from)    { conditions.push('timestamp >= ?'); params.push(from); }
    if (to)      { conditions.push('timestamp <= ?'); params.push(to);   }

    const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM sensor_readings ${where}`, params
    );

    const [rows] = await pool.execute(
      `SELECT * FROM sensor_readings ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ total, page: parseInt(page), limit: parseInt(limit), data: rows });
  } catch (err) {
    console.error('GET /history error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/export?node_id=&from=&to=  — No pagination, full data for export
router.get('/export', async (req, res) => {
  try {
    const { node_id, from, to } = req.query;
    const conditions = [];
    const params     = [];

    if (node_id) { conditions.push('node_id = ?'); params.push(node_id); }
    if (from)    { conditions.push('timestamp >= ?'); params.push(from); }
    if (to)      { conditions.push('timestamp <= ?'); params.push(to);   }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.execute(
      `SELECT * FROM sensor_readings ${where} ORDER BY timestamp DESC LIMIT 5000`,
      params
    );

    res.json({ data: rows });
  } catch (err) {
    console.error('GET /history/export error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
