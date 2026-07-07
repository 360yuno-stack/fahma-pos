import { useState, useEffect } from 'react';
import { cashClosuresAPI, dashboardAPI, expensesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './CashClosure.css';

export default function CashClosure() {
  const { addToast } = useToast();
  const { user } = useAuth();
  
  const [closures, setClosures] = useState([]);
  const [stats, setStats] = useState(null);
  const [expensesToday, setExpensesToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [closingCash, setClosingCash] = useState(false);

  // Form states
  const [openingBalance, setOpeningBalance] = useState(150);
  const [actualCash, setActualCash] = useState(150);
  const [closureNotes, setClosureNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [closuresRes, statsRes, expensesRes] = await Promise.all([
        cashClosuresAPI.getAll(),
        dashboardAPI.getStats(),
        expensesAPI.getAll()
      ]);

      const list = Array.isArray(closuresRes.data) ? closuresRes.data : (closuresRes.data?.data || []);
      setClosures(list);
      setStats(statsRes.data);

      // Calcular gastos de hoy
      const todayStr = new Date().toISOString().split('T')[0];
      const rawExpenses = Array.isArray(expensesRes.data) ? expensesRes.data : (expensesRes.data?.data || []);
      const todayExpenses = rawExpenses.filter(e => {
        const eDate = new Date(e.date).toISOString().split('T')[0];
        return eDate === todayStr;
      });
      const totalExpenses = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      setExpensesToday(totalExpenses);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar datos de caja', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cashSales = stats?.cashSales || 0;
  const expectedCash = Number((Number(openingBalance) + cashSales - expensesToday).toFixed(2));
  const difference = Number((Number(actualCash) - expectedCash).toFixed(2));

  // Sync actual cash input with expected cash on initial load
  useEffect(() => {
    if (stats) {
      setActualCash(expectedCash);
    }
  }, [stats, openingBalance, expensesToday]);

  const handleCloseCash = async () => {
    setClosingCash(true);
    try {
      await cashClosuresAPI.create({
        openingBalance: Number(openingBalance),
        actualCash: Number(actualCash),
        closedBy: user?._id || user?.id || null,
        notes: closureNotes
      });
      addToast('Cierre de caja registrado y guardado con éxito', 'success');
      setClosureNotes('');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cerrar caja', 'error');
    } finally {
      setClosingCash(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Cargando datos contables de caja...</div>
      </div>
    );
  }

  return (
    <div className="cash-closure-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cierre de Caja</h1>
          <p className="page-subtitle">Control de arqueo, cuadre de caja diario y auditoría de ventas</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Card: Form & Audit */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="mdi mdi-cash-register" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
              Formulario de Arqueo y Cuadre
            </h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fondo de Caja Apertura (€)</label>
                <input
                  type="number"
                  className="form-input"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
                <span className="form-helper">Efectivo inicial en el cajón</span>
              </div>
              <div className="form-group">
                <label className="form-label">Efectivo Real Contado (€)</label>
                <input
                  type="number"
                  className="form-input font-bold"
                  style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}
                  value={actualCash}
                  onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
                <span className="form-helper">Efectivo final contado al cierre</span>
              </div>
            </div>

            <div className="audit-summary-box" style={{ marginTop: '20px', padding: '16px', background: 'var(--color-bg)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>Cálculo Teórico de Caja</h4>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 0' }}>Fondo de Caja (Apertura):</td>
                    <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(openingBalance)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0' }}>(+) Ventas en Efectivo:</td>
                    <td style={{ textAlign: 'right', fontWeight: '500', color: 'var(--color-success)' }}>{formatCurrency(cashSales)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0' }}>(-) Gastos del Día:</td>
                    <td style={{ textAlign: 'right', fontWeight: '500', color: 'var(--color-danger)' }}>{formatCurrency(expensesToday)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px dashed var(--color-border)', borderBottom: '1px dashed var(--color-border)', fontWeight: 'bold' }}>
                    <td style={{ padding: '8px 0' }}>(=) Caja Teórica Esperada:</td>
                    <td style={{ textAlign: 'right', fontSize: '15px' }}>{formatCurrency(expectedCash)}</td>
                  </tr>
                  <tr style={{ fontWeight: 'bold' }}>
                    <td style={{ padding: '8px 0' }}>Caja Real Contada:</td>
                    <td style={{ textAlign: 'right', fontSize: '15px', color: 'var(--color-primary)' }}>{formatCurrency(actualCash)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid var(--color-text)', fontWeight: 'bold', fontSize: '16px' }}>
                    <td style={{ padding: '10px 0' }}>Descuadre / Diferencia:</td>
                    <td style={{ 
                      textAlign: 'right', 
                      color: difference === 0 ? 'var(--color-success)' : difference > 0 ? 'var(--color-info)' : 'var(--color-danger)'
                    }}>
                      {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {difference !== 0 && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  background: difference > 0 ? 'var(--color-info-bg)' : 'var(--color-danger-bg)', 
                  color: difference > 0 ? 'var(--color-info)' : 'var(--color-danger)', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span className="mdi mdi-alert-circle" />
                  {difference > 0 
                    ? 'Hay un sobrante de efectivo en el cajón con respecto a las ventas registradas.'
                    : 'Hay un faltante de efectivo en el cajón. Verifica los tickets y gastos.'}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Anotaciones / Observaciones del Cierre</label>
              <textarea
                className="form-input"
                rows="2"
                style={{ resize: 'none' }}
                placeholder="Añade notas del descuadre, incidencias de cobro, turnos, etc..."
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
              />
            </div>

            <button 
              className="btn btn-danger btn-lg font-bold" 
              style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={handleCloseCash} 
              disabled={closingCash}
            >
              <span className="mdi mdi-lock" />
              {closingCash ? 'Procesando Cierre...' : 'Registrar y Cerrar Caja'}
            </button>
          </div>
        </div>

        {/* Right Card: Stats & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3 className="card-title">Resumen Financiero de Hoy</h3>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="stat-card" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="mdi mdi-trending-up" style={{ color: 'var(--color-success)', fontSize: '20px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Ventas Totales</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{formatCurrency(stats?.totalSales)}</div>
              </div>

              <div className="stat-card" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="mdi mdi-receipt" style={{ color: 'var(--color-primary)', fontSize: '20px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Tickets de Hoy</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{stats?.totalOrders || 0}</div>
              </div>

              <div className="stat-card" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="mdi mdi-cash" style={{ color: 'var(--color-warning)', fontSize: '20px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Ventas Efectivo</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-warning)' }}>{formatCurrency(stats?.cashSales)}</div>
              </div>

              <div className="stat-card" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="mdi mdi-credit-card" style={{ color: 'var(--color-info)', fontSize: '20px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Ventas Tarjeta</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-info)' }}>{formatCurrency(stats?.cardSales)}</div>
              </div>

              <div className="stat-card" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="mdi mdi-cash-minus" style={{ color: 'var(--color-danger)', fontSize: '20px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Gastos de Hoy (Deducidos de Caja)</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-danger)' }}>{formatCurrency(expensesToday)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Closures History */}
      <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
        <div className="card-header">
          <h3 className="card-title">
            <span className="mdi mdi-history" style={{ marginRight: '8px' }} />
            Historial de Cierres Registrados
          </h3>
        </div>
        {closures.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon mdi mdi-cash-lock" />
            <h3 className="empty-state-title">Sin cierres de caja</h3>
            <p className="empty-state-description">No se han registrado cierres en el sistema todavía</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha Cierre</th>
                  <th>Fondo Caja</th>
                  <th>Caja Teórica</th>
                  <th>Caja Real</th>
                  <th>Descuadre</th>
                  <th>Totales Ventas</th>
                  <th>Efectivo / Tarjeta</th>
                  <th>Gastos</th>
                  <th>Cerrado por</th>
                  <th>Notas / Comentarios</th>
                </tr>
              </thead>
              <tbody>
                {closures.map(c => {
                  const diffVal = c.difference ?? ((c.actualCash ?? 0) - (c.expectedCash ?? 0));
                  return (
                    <tr key={c._id || c.id}>
                      <td style={{ fontWeight: '500' }}>
                        {c.date ? new Date(c.date).toLocaleDateString('es-ES') : new Date(c.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td>{formatCurrency(c.openingBalance)}</td>
                      <td>{formatCurrency(c.expectedCash)}</td>
                      <td style={{ fontWeight: '600' }}>{formatCurrency(c.actualCash)}</td>
                      <td style={{ 
                        fontWeight: '700', 
                        color: diffVal === 0 ? 'var(--color-success)' : diffVal > 0 ? 'var(--color-info)' : 'var(--color-danger)'
                      }}>
                        {diffVal > 0 ? '+' : ''}{formatCurrency(diffVal)}
                      </td>
                      <td><strong>{formatCurrency(c.totalSales)}</strong></td>
                      <td style={{ fontSize: '12px' }}>
                        <div><span style={{color: 'var(--color-text-secondary)'}}>Efectivo:</span> {formatCurrency(c.cashSales)}</div>
                        <div><span style={{color: 'var(--color-text-secondary)'}}>Tarjeta:</span> {formatCurrency(c.cardSales)}</div>
                      </td>
                      <td style={{ color: 'var(--color-danger)' }}>{formatCurrency(c.expenses)}</td>
                      <td>{c.closedBy?.username || c.closedBy?.firstName || '-'}</td>
                      <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.notes}>
                        {c.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
