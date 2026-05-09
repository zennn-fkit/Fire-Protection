import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

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
