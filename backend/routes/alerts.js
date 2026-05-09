import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/alerts?severity=&resolved=&limit=&page=
router.get('/', async (req, res) => {
  try {
    const { severity, resolved, limit = 50, page = 1 } = req.query;
    const conditions = [];
    const params     = [];

    if (severity) { conditions.push('severity = ?');  params.push(severity); }
    if (resolved !== undefined) {
      conditions.push('resolved = ?');
      params.push(resolved === 'true' ? 1 : 0);
    }

    const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM alert_logs ${where}`, params
    );

    const [rows] = await pool.execute(
      `SELECT * FROM alert_logs ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ total, page: parseInt(page), limit: parseInt(limit), data: rows });
  } catch (err) {
    console.error('GET /alerts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', async (req, res) => {
  try {
    await pool.execute(
      `UPDATE alert_logs SET resolved=TRUE, resolved_at=NOW() WHERE id=?`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /alerts resolve error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
