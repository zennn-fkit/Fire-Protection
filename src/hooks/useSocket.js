import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSensor } from '../context/SensorContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export function useSocket() {
  const { setConnected, sensorUpdate, alertNew, controlUpdate } = useSensor();
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 5000,
    });
    socketRef.current = socket;

    socket.on('connect',    () => { setConnected(true);  console.log('✅ Socket connected'); });
    socket.on('disconnect', () => { setConnected(false); console.log('❌ Socket disconnected'); });

    socket.on('sensor:update',  sensorUpdate);
    socket.on('alert:new',      alertNew);
    socket.on('control:update', controlUpdate);

    return () => { socket.disconnect(); };
  }, [setConnected, sensorUpdate, alertNew, controlUpdate]);

  return socketRef;
}
