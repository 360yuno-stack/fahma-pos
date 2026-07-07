import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tablesAPI } from '../services/api';
import './TableRequests.css';

const STATUS_CONFIG = {
  free: { label: 'Libre', badgeClass: 'tr-table-status-badge--free', cardClass: 'tr-table-card--free' },
  available: { label: 'Libre', badgeClass: 'tr-table-status-badge--free', cardClass: 'tr-table-card--free' },
  libre: { label: 'Libre', badgeClass: 'tr-table-status-badge--free', cardClass: 'tr-table-card--free' },
  occupied: { label: 'Ocupada', badgeClass: 'tr-table-status-badge--occupied', cardClass: 'tr-table-card--occupied' },
  ocupada: { label: 'Ocupada', badgeClass: 'tr-table-status-badge--occupied', cardClass: 'tr-table-card--occupied' },
  reserved: { label: 'Reservada', badgeClass: 'tr-table-status-badge--reserved', cardClass: 'tr-table-card--reserved' },
  reservada: { label: 'Reservada', badgeClass: 'tr-table-status-badge--reserved', cardClass: 'tr-table-card--reserved' },
  requesting: { label: 'Solicitando', badgeClass: 'tr-table-status-badge--requesting', cardClass: 'tr-table-card--requesting' },
  solicitando: { label: 'Solicitando', badgeClass: 'tr-table-status-badge--requesting', cardClass: 'tr-table-card--requesting' },
};

function getStatusConfig(status) {
  const s = (status || 'free').toLowerCase();
  return STATUS_CONFIG[s] || STATUS_CONFIG.free;
}

export default function TableRequests() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const fetchTables = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await tablesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.tables || []);
      setTables(list);

      // Update selected table data if one is selected
      if (selectedTable) {
        const updated = list.find(t => (t._id || t.id) === (selectedTable._id || selectedTable.id));
        if (updated) setSelectedTable(updated);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      if (!silent) {
        setError('Error al cargar las mesas');
        addToast('Error al cargar las mesas', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedTable, addToast]);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchTables(true), 10000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchTables]);

  // Group tables by zone
  function groupByZone(tablesList) {
    const groups = {};
    tablesList.forEach(t => {
      const zone = t.zone || t.area || t.zona || 'General';
      if (!groups[zone]) groups[zone] = [];
      groups[zone].push(t);
    });
    return groups;
  }

  async function handleReleaseTable(table) {
    try {
      await tablesAPI.updateStatus(table._id || table.id, { status: 'free' });
      addToast(`Mesa "${table.name || table.nombre}" liberada`, 'success');
      setSelectedTable(null);
      fetchTables(true);
    } catch (err) {
      console.error('Error releasing table:', err);
      addToast('Error al liberar la mesa', 'error');
    }
  }

  function handleNewOrder(table) {
    navigate('/tpv', { state: { tableId: table._id || table.id, tableName: table.name || table.nombre } });
  }

  const zones = groupByZone(tables);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Cargando mesas...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Solicitudes de Mesa</h1>
          <p className="page-subtitle">Gestiona el estado de las mesas en tiempo real</p>
        </div>
        <div className="page-actions">
          <div className="tr-auto-refresh">
            <span
              className={`tr-auto-refresh-dot ${autoRefresh ? 'tr-auto-refresh-dot--active' : ''}`}
            />
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
            <span>Auto-refrescar</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchTables()}>
            <span className="mdi mdi-refresh" />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 'var(--space-md)', background: 'var(--color-danger-bg)', color: 'var(--color-danger-dark)', marginBottom: 'var(--space-lg)' }}>
          <span className="mdi mdi-alert-circle" style={{ marginRight: '8px' }} />
          {error}
        </div>
      )}

      <div className="table-requests-layout">
        {/* Left Panel: Tables Grid */}
        <div className="tr-tables-panel">
          {tables.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon mdi mdi-table-furniture" />
              <div className="empty-state-title">No hay mesas</div>
              <div className="empty-state-description">
                Crea mesas desde la sección de configuración
              </div>
            </div>
          ) : (
            Object.entries(zones).map(([zone, zoneTables]) => (
              <div key={zone} className="tr-zone-group">
                <div className="tr-zone-header">
                  <span className="mdi mdi-map-marker" />
                  <span className="tr-zone-title">{zone}</span>
                  <span className="tr-zone-count">{zoneTables.length} mesas</span>
                </div>
                <div className="tr-tables-grid">
                  {zoneTables.map(table => {
                    const sc = getStatusConfig(table.status || table.estado);
                    const tableId = table._id || table.id;
                    const isSelected = selectedTable && (selectedTable._id || selectedTable.id) === tableId;

                    return (
                      <div
                        key={tableId}
                        className={`tr-table-card ${sc.cardClass} ${isSelected ? 'tr-table-card--selected' : ''}`}
                        onClick={() => setSelectedTable(table)}
                      >
                        <div className="tr-table-card-header">
                          <span className="tr-table-name">
                            {table.name || table.nombre || `Mesa ${table.number || table.numero || ''}`}
                          </span>
                          <div className="tr-table-card-icon">
                            <span className="mdi mdi-table-furniture" />
                          </div>
                        </div>

                        <div className="tr-table-meta">
                          <span className="mdi mdi-map-marker-outline" />
                          <span>{table.zone || table.area || table.zona || 'General'}</span>
                          <span style={{ margin: '0 4px' }}>•</span>
                          <span className="mdi mdi-account-group" />
                          <span>{table.capacity || table.capacidad || '—'} pax</span>
                        </div>

                        <span className={`tr-table-status-badge ${sc.badgeClass}`}>
                          {sc.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Panel: Detail */}
        <div className="tr-detail-panel">
          {!selectedTable ? (
            <div className="tr-detail-empty">
              <span className="mdi mdi-gesture-tap" />
              <h3>Selecciona una mesa</h3>
              <p>Haz clic en una mesa para ver su información y acciones disponibles</p>
            </div>
          ) : (
            <>
              <div className="tr-detail-header">
                <h2>
                  {selectedTable.name || selectedTable.nombre || `Mesa ${selectedTable.number || selectedTable.numero || ''}`}
                </h2>
                <p>
                  {selectedTable.zone || selectedTable.area || selectedTable.zona || 'General'} •
                  Estado: {getStatusConfig(selectedTable.status || selectedTable.estado).label}
                </p>
              </div>

              <div className="tr-detail-body">
                <div className="tr-detail-info-row">
                  <span className="tr-detail-info-label">
                    <span className="mdi mdi-identifier" />
                    ID
                  </span>
                  <span className="tr-detail-info-value">
                    {(selectedTable._id || selectedTable.id || '—').toString().slice(-8)}
                  </span>
                </div>

                <div className="tr-detail-info-row">
                  <span className="tr-detail-info-label">
                    <span className="mdi mdi-account-group" />
                    Capacidad
                  </span>
                  <span className="tr-detail-info-value">
                    {selectedTable.capacity || selectedTable.capacidad || '—'} personas
                  </span>
                </div>

                <div className="tr-detail-info-row">
                  <span className="tr-detail-info-label">
                    <span className="mdi mdi-map-marker" />
                    Zona
                  </span>
                  <span className="tr-detail-info-value">
                    {selectedTable.zone || selectedTable.area || selectedTable.zona || 'General'}
                  </span>
                </div>

                <div className="tr-detail-info-row">
                  <span className="tr-detail-info-label">
                    <span className="mdi mdi-circle" />
                    Estado
                  </span>
                  <span className="tr-detail-info-value">
                    <span className={`tr-table-status-badge ${getStatusConfig(selectedTable.status || selectedTable.estado).badgeClass}`}>
                      {getStatusConfig(selectedTable.status || selectedTable.estado).label}
                    </span>
                  </span>
                </div>

                {selectedTable.currentOrder && (
                  <div className="tr-detail-info-row">
                    <span className="tr-detail-info-label">
                      <span className="mdi mdi-receipt" />
                      Pedido Actual
                    </span>
                    <span className="tr-detail-info-value">
                      #{selectedTable.currentOrder?.orderNumber || selectedTable.currentOrder}
                    </span>
                  </div>
                )}
              </div>

              <div className="tr-detail-actions">
                {(['free', 'available', 'libre'].includes((selectedTable.status || selectedTable.estado || 'free').toLowerCase())) ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleNewOrder(selectedTable)}
                  >
                    <span className="mdi mdi-plus-circle" />
                    Nuevo Pedido
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleNewOrder(selectedTable)}
                    >
                      <span className="mdi mdi-plus-circle" />
                      Nuevo Pedido
                    </button>
                    <button
                      className="btn btn-warning"
                      onClick={() => handleReleaseTable(selectedTable)}
                    >
                      <span className="mdi mdi-lock-open-variant" />
                      Liberar Mesa
                    </button>
                  </>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedTable(null)}
                >
                  <span className="mdi mdi-close" />
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
