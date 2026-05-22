import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 30 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 350 },
  },
  exit: {
    opacity: 0, scale: 0.9, y: 20,
    transition: { duration: 0.2 },
  },
};

export default function EnergyResetModal({
  isOpen,
  onClose,
  onConfirm,
  currentKwh = 0,
  energyOffset = 0,
  lastResetDate = null,
  loading = false,
}) {
  const [note, setNote] = useState('');
  const periodKwh = (currentKwh - energyOffset).toFixed(2);

  const handleConfirm = () => {
    onConfirm({ current_kwh: currentKwh, note: note.trim() || null });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Belum pernah';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 420,
              background: 'linear-gradient(135deg, rgba(15,23,42,0.97), rgba(30,41,59,0.97))',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 20,
              padding: '28px 28px 24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
              }}>⚡</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>Reset Energy Meter</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Mulai tracking pemakaian baru</div>
              </div>
            </div>

            {/* Info Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {/* Pemakaian Periode */}
              <div style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(245,158,11,0.08))',
                border: '1px solid rgba(249,115,22,0.2)',
              }}>
                <div style={{ fontSize: 10, color: '#fb923c', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Pemakaian Periode Ini
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#f97316', fontFamily: "'Inter', sans-serif" }}>
                  {periodKwh} <span style={{ fontSize: 13, fontWeight: 600, color: '#fb923c' }}>kWh</span>
                </div>
              </div>

              {/* Detail Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{
                  padding: '10px 12px', borderRadius: 12,
                  background: 'rgba(51,65,85,0.4)',
                  border: '1px solid rgba(71,85,105,0.3)',
                }}>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Total Sensor</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
                    {Number(currentKwh).toFixed(2)} <span style={{ fontSize: 10, color: '#94a3b8' }}>kWh</span>
                  </div>
                </div>
                <div style={{
                  padding: '10px 12px', borderRadius: 12,
                  background: 'rgba(51,65,85,0.4)',
                  border: '1px solid rgba(71,85,105,0.3)',
                }}>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Reset Terakhir</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4 }}>
                    {formatDate(lastResetDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Note Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                📝 Catatan (opsional)
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Contoh: Mei 2026"
                maxLength={100}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(71,85,105,0.5)',
                  color: '#f8fafc', fontSize: 13,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(71,85,105,0.5)'}
              />
            </div>

            {/* Warning */}
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.15)',
              marginBottom: 20,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>ℹ️</span>
              <div style={{ fontSize: 11, color: '#fbbf24', lineHeight: 1.5 }}>
                Gauge akan kembali ke <strong>0 kWh</strong>. Data historis sensor tetap tersimpan di database.
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  background: 'rgba(51,65,85,0.5)',
                  border: '1px solid rgba(71,85,105,0.4)',
                  color: '#94a3b8', fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!loading) { e.target.style.background = 'rgba(51,65,85,0.8)'; e.target.style.color = '#e2e8f0'; }}}
                onMouseLeave={e => { e.target.style.background = 'rgba(51,65,85,0.5)'; e.target.style.color = '#94a3b8'; }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  padding: '10px 24px', borderRadius: 10,
                  background: loading
                    ? 'rgba(249,115,22,0.4)'
                    : 'linear-gradient(135deg, #f97316, #f59e0b)',
                  border: 'none',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(249,115,22,0.3)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={e => { if (!loading) e.target.style.boxShadow = '0 6px 20px rgba(249,115,22,0.5)'; }}
                onMouseLeave={e => { if (!loading) e.target.style.boxShadow = '0 4px 15px rgba(249,115,22,0.3)'; }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Mereset...
                  </>
                ) : (
                  <>⚡ Reset Sekarang</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  );
}
