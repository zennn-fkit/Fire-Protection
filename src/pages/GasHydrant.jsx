import { useState } from 'react';
import { useSensor } from '../context/SensorContext';
import Header from '../components/layout/Header';
import GasPanel from '../components/dashboard/GasPanel';
import HydrantPanel from '../components/dashboard/HydrantPanel';
import WaterTankPanel from '../components/dashboard/WaterTankPanel';
import { Flame, Droplets } from 'lucide-react'; // Placeholder icons for schematic

export default function GasHydrant() {
  const { state } = useSensor();
  const { node4, water_level } = state;
  const [activeTab, setActiveTab] = useState('gas');

  return (
    <div className="page-gradient" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title="Gas & Hydrant Monitoring" />

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1a3558' }}>
          <button
            onClick={() => setActiveTab('gas')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'gas' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'gas' ? '#e2e8f0' : '#64748b',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            SMART GAS
          </button>
          <button
            onClick={() => setActiveTab('hydrant')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'hydrant' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'hydrant' ? '#e2e8f0' : '#64748b',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            HYDRANT
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'gas' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
            {/* INERT GAS */}
            <GasPanel 
              title="SMART INERT GAS MONITORING"
              pressure={-302}
              maxPressure={400}
              valve_status="OPEN"
              valveLabel="Status Katup"
              iconColor="#f59e0b" // Orange/amber
            />
            {/* CO2 PRESSURE */}
            <GasPanel 
              title="SMART CO2 PRESSURE MONITORING"
              pressure={-369}
              maxPressure={400}
              valve_status="OPEN" // "NORMAL" mock
              valveLabel="Status Kebocoran"
              iconColor="#ef4444" // Red
            />
            {/* SCHEMATIC */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 150 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 0 12px' }}>
                FIELD SCHEMATIC / LIVE
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                 <div style={{
                    width: '100%', height: 120, 
                    background: '#040b16', borderRadius: 12, border: '1px solid #1a3558',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 12px 12px 12px',
                    position: 'relative'
                 }}>
                    <Flame size={48} color="#10b981" />
                    <div style={{
                      position: 'absolute', bottom: 10, right: 10,
                      padding: '4px 10px', border: '1px solid #10b981', borderRadius: 4,
                      fontSize: 8, color: '#10b981', fontWeight: 700, letterSpacing: '0.05em'
                    }}>
                      GAS-UNIT
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hydrant' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
            {/* HYDRANT PRESSURE */}
            {node4 ? (
              <HydrantPanel 
                pressure={node4.pressure}
                valve_status={node4.valve_status}
                maxPressure={12}
              />
            ) : (
              <HydrantPanel pressure={0} valve_status="CLOSED" maxPressure={12} />
            )}

            {/* WATER TANK */}
            <WaterTankPanel level={water_level !== null ? water_level : 0} />

            {/* SCHEMATIC */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 150 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 0 12px' }}>
                FIELD SCHEMATIC / LIVE
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                 <div style={{
                    width: '100%', height: 120, 
                    background: '#040b16', borderRadius: 12, border: '1px solid #1a3558',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 12px 12px 12px',
                    position: 'relative'
                 }}>
                    <Droplets size={48} color="#10b981" />
                    <div style={{
                      position: 'absolute', bottom: 10, right: 10,
                      padding: '4px 10px', border: '1px solid #10b981', borderRadius: 4,
                      fontSize: 8, color: '#10b981', fontWeight: 700, letterSpacing: '0.05em'
                    }}>
                      HYD-01 / ACTIVE
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
