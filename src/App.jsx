import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';

import { SensorProvider, useSensor } from './context/SensorContext';
import { useSocket } from './hooks/useSocket';
import Sidebar   from './components/layout/Sidebar';
import Header    from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import GasHydrant from './pages/GasHydrant';
import History   from './pages/History';
import Control   from './pages/Control';

// Inner app: connects socket + mock ticker
function InnerApp() {
  useSocket();
  const { state, mockTick } = useSensor();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If not connected to backend, run mock data every 3s
  useEffect(() => {
    if (!state.connected) {
      const interval = setInterval(mockTick, 3000);
      return () => clearInterval(interval);
    }
  }, [state.connected, mockTick]);

  const isWaitingForData = !state.node1 && !state.node2 && !state.node3 && !state.node4 && !state.detectors && state.water_level === null;

  if (isWaitingForData) {
    return (
      <div className="page-gradient" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header title="Dashboard Monitoring" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
          <div style={{
             width: 50, height: 50, border: '4px solid #1e293b', borderTopColor: '#3b82f6',
             borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#94a3b8', fontSize: 16, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
            Menunggu koneksi data sensor...
          </p>
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className={`main-content ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/gas-hydrant" element={<GasHydrant />} />
          <Route path="/history" element={<History   />} />
          <Route path="/control" element={<Control   />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SensorProvider>
        <InnerApp />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0d1f38',
              color: '#e2e8f0',
              border: '1px solid #1a3558',
              borderRadius: '10px',
              fontSize: '13px',
            },
          }}
        />
      </SensorProvider>
    </BrowserRouter>
  );
}
