import { useState, useEffect, useCallback } from 'react';
import { Download, FileText, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { getHistory, getExport } from '../utils/api';
import { exportToPDF } from '../utils/exportPDF';
import { exportToCSV } from '../utils/exportCSV';
import Header from '../components/layout/Header';

const NODE_LABELS = { 1: 'Power Sensor', 2: 'Humidity #1', 3: 'Humidity #2', 4: 'Pressure' };
const STATUS_COLOR = { NORMAL: '#10b981', WARNING: '#f59e0b', DANGER: '#ef4444' };

function StatusBadge({ v }) {
  if (!v) return <span style={{ color: '#475569' }}>–</span>;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
      color: STATUS_COLOR[v], background: `${STATUS_COLOR[v]}18`,
      border: `1px solid ${STATUS_COLOR[v]}40`,
    }}>{v}</span>
  );
}

function val(v, dec = 1) {
  return v != null ? Number(v).toFixed(dec) : <span style={{ color: '#475569' }}>–</span>;
}

export default function History() {
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ node_id: '', from: '', to: '' });
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getHistory({ ...filters, limit, page });
      setRows(data.data);
      setTotal(data.total);
    } catch {
      // Demo mode: generate mock rows
      const mock = Array.from({ length: limit }, (_, i) => ({
        id: i + 1 + (page - 1) * limit,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        node_id: (i % 4) + 1,
        voltage: i % 4 === 0 ? (218 + Math.random() * 6).toFixed(1) : null,
        current_amp: i % 4 === 0 ? (140 + Math.random() * 20).toFixed(1) : null,
        frequency: i % 4 === 0 ? (50 + (Math.random() - 0.5) * 0.4).toFixed(2) : null,
        power_kw: i % 4 === 0 ? (1.5 + Math.random() * 0.5).toFixed(2) : null,
        temperature: i % 4 !== 0 && i % 4 !== 3 ? (27 + Math.random() * 5).toFixed(1) : null,
        humidity: i % 4 !== 0 && i % 4 !== 3 ? (50 + Math.random() * 15).toFixed(1) : null,
        pressure: i % 4 === 3 ? (4 + Math.random() * 3).toFixed(2) : null,
        valve_status: i % 4 === 3 ? 'CLOSED' : null,
        smoke_status: 'NORMAL', flame_status: 'NORMAL',
        heat_status: 'NORMAL', thermal_status: 'NORMAL',
        water_level: i % 4 === 0 ? (75 + Math.random() * 10).toFixed(1) : null,
      }));
      setRows(mock);
      setTotal(200);
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async (type) => {
    try {
      const { data } = await getExport(filters);
      const d = data.data;
      type === 'pdf' ? exportToPDF(d, filters) : exportToCSV(d);
    } catch {
      // Fallback: export current rows
      type === 'pdf' ? exportToPDF(rows, filters) : exportToCSV(rows);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const COLS = [
    { label: 'Timestamp',       w: 140 },
    { label: 'Node',            w: 110 },
    { label: 'Tegangan (V)',    w: 90  },
    { label: 'Arus (A)',        w: 80  },
    { label: 'Frekuensi (Hz)', w: 100 },
    { label: 'Daya (kW)',      w: 80  },
    { label: 'Suhu (°C)',      w: 80  },
    { label: 'Kelembaban (%)', w: 100 },
    { label: 'Tekanan (Bar)',  w: 100 },
    { label: 'Katup',          w: 70  },
    { label: 'Asap',           w: 70  },
    { label: 'Api',            w: 70  },
    { label: 'Air (%)',        w: 70  },
  ];

  return (
    <div className="page-gradient" style={{ minHeight: '100vh' }}>
      <Header title="Riwayat Data Sensor" />

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Filter & Export Bar */}
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Node filter */}
          <select
            value={filters.node_id}
            onChange={e => { setFilters(f => ({ ...f, node_id: e.target.value })); setPage(1); }}
            style={{ background: '#080f1e', border: '1px solid #1a3558', color: '#cbd5e1', padding: '7px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
          >
            <option value="">Semua Node</option>
            {[1,2,3,4].map(n => <option key={n} value={n}>Node {n} – {NODE_LABELS[n]}</option>)}
          </select>

          {/* Date range */}
          {['from', 'to'].map(k => (
            <input
              key={k}
              type="datetime-local"
              value={filters[k]}
              onChange={e => { setFilters(f => ({ ...f, [k]: e.target.value })); setPage(1); }}
              style={{ background: '#080f1e', border: '1px solid #1a3558', color: '#cbd5e1', padding: '7px 12px', borderRadius: 8, fontSize: 13 }}
            />
          ))}

          <button onClick={fetchData} className="btn btn-outline" style={{ gap: 6 }} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => handleExport('csv')} className="btn btn-outline">
              <Download size={13} />  CSV
            </button>
            <button onClick={() => handleExport('pdf')} className="btn btn-primary">
              <FileText size={13} />  PDF
            </button>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Menampilkan <strong style={{ color: '#e2e8f0' }}>{rows.length}</strong> dari <strong style={{ color: '#e2e8f0' }}>{total}</strong> record
          </span>
          {loading && <RefreshCw size={12} color="#64748b" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {COLS.map(c => (
                    <th key={c.label} style={{ minWidth: c.w }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id ?? i}>
                    <td>{r.timestamp ? format(new Date(r.timestamp), 'dd/MM/yy HH:mm:ss') : '–'}</td>
                    <td>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                        background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)',
                      }}>
                        Node {r.node_id} · {NODE_LABELS[r.node_id]}
                      </span>
                    </td>
                    <td>{val(r.voltage)}</td>
                    <td>{val(r.current_amp)}</td>
                    <td>{val(r.frequency, 2)}</td>
                    <td>{val(r.power_kw, 2)}</td>
                    <td>{val(r.temperature)}</td>
                    <td>{val(r.humidity)}</td>
                    <td>{val(r.pressure, 2)}</td>
                    <td>
                      {r.valve_status
                        ? <span style={{ color: r.valve_status === 'OPEN' ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 10 }}>{r.valve_status}</span>
                        : <span style={{ color: '#475569' }}>–</span>}
                    </td>
                    <td><StatusBadge v={r.smoke_status} /></td>
                    <td><StatusBadge v={r.flame_status} /></td>
                    <td>{val(r.water_level)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-outline" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 3, totalPages - 6)) + i;
              return (
                <button key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: p === page ? 'rgba(249,115,22,0.2)' : 'transparent',
                    border: `1px solid ${p === page ? '#f97316' : '#1a3558'}`,
                    color: p === page ? '#f97316' : '#64748b',
                  }}
                >{p}</button>
              );
            })}
            <button className="btn btn-outline" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
