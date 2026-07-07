import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dashboardAPI, ordersAPI } from '../services/api';
import './Dashboard.css';

const MOCK_STATS = {
  totalSales: 0,
  totalOrders: 0,
  occupiedTables: 0,
  totalTables: 0,
  avgTicket: 0,
  recentOrders: []
};

const STATUS_MAP = {
  pending: { label: 'Pendiente', dotClass: 'order-status-dot--pending' },
  preparing: { label: 'Preparando', dotClass: 'order-status-dot--preparing' },
  completed: { label: 'Completado', dotClass: 'order-status-dot--completed' },
  cancelled: { label: 'Cancelado', dotClass: 'order-status-dot--cancelled' },
  delivered: { label: 'Entregado', dotClass: 'order-status-dot--completed' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState(MOCK_STATS);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.getStats();
      const data = res.data?.data || res.data || MOCK_STATS;
      setStats({
        totalSales: data.totalSales ?? data.ventas ?? 0,
        totalOrders: data.totalOrders ?? data.pedidos ?? 0,
        occupiedTables: data.occupiedTables ?? data.mesasOcupadas ?? 0,
        totalTables: data.totalTables ?? data.totalMesas ?? 0,
        avgTicket: data.avgTicket ?? data.ticketMedio ?? 0,
        recentOrders: data.recentOrders ?? data.pedidosRecientes ?? []
      });

      const orders = data.recentOrders ?? data.pedidosRecientes ?? [];
      if (orders.length > 0) {
        setRecentOrders(orders.slice(0, 10));
      } else {
        // Fallback: fetch from orders API
        try {
          const ordRes = await ordersAPI.getAll({ limit: 10, sort: '-createdAt' });
          const list = Array.isArray(ordRes.data) ? ordRes.data : (ordRes.data?.data || ordRes.data?.orders || []);
          setRecentOrders(list.slice(0, 10));
        } catch {
          setRecentOrders([]);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setStats(MOCK_STATS);
      setRecentOrders([]);
      // Don't show error toast, just use mock data
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }

  function getStatusInfo(status) {
    const s = (status || 'pending').toLowerCase();
    return STATUS_MAP[s] || STATUS_MAP.pending;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Cargando panel de control...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <h1>Bienvenido, {user?.firstName || user?.name || 'Admin'}</h1>
        <p>Resumen de tu negocio hoy</p>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-stats-row">
        <div className="stat-card stat-card--blue">
          <div className="stat-card-icon">
            <span className="mdi mdi-currency-eur" />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Ventas Hoy</div>
            <div className="stat-card-value">{formatCurrency(stats.totalSales)}</div>
          </div>
        </div>

        <div className="stat-card stat-card--green">
          <div className="stat-card-icon">
            <span className="mdi mdi-receipt" />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Pedidos Hoy</div>
            <div className="stat-card-value">{stats.totalOrders}</div>
          </div>
        </div>

        <div className="stat-card stat-card--orange">
          <div className="stat-card-icon">
            <span className="mdi mdi-table-furniture" />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Mesas Ocupadas</div>
            <div className="stat-card-value">
              {stats.occupiedTables}/{stats.totalTables}
            </div>
          </div>
        </div>

        <div className="stat-card stat-card--purple">
          <div className="stat-card-icon">
            <span className="mdi mdi-tag" />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-label">Ticket Medio</div>
            <div className="stat-card-value">{formatCurrency(stats.avgTicket)}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">
        <button className="btn btn-primary" onClick={() => navigate('/tpv')}>
          <span className="mdi mdi-point-of-sale" />
          Abrir TPV
        </button>
        <button className="btn btn-success" onClick={() => navigate('/mesas')}>
          <span className="mdi mdi-table-furniture" />
          Ver Mesas
        </button>
        <button className="btn btn-warning" onClick={() => navigate('/solicitudes-mesa')}>
          <span className="mdi mdi-bell-ring" />
          Solicitudes de Mesa
        </button>
        <button className="btn btn-secondary" onClick={fetchData}>
          <span className="mdi mdi-refresh" />
          Actualizar
        </button>
      </div>

      {/* Recent Orders */}
      <div className="card dashboard-recent-orders">
        <div className="card-header">
          <h2 className="card-title">
            <span className="mdi mdi-history" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
            Pedidos Recientes
          </h2>
          <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            Últimos 10 pedidos
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon mdi mdi-receipt-text-outline" />
            <div className="empty-state-title">Sin pedidos recientes</div>
            <div className="empty-state-description">
              Los pedidos realizados aparecerán aquí
            </div>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Mesa</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Método Pago</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, idx) => {
                  const statusInfo = getStatusInfo(order.status || order.estado);
                  return (
                    <tr key={order._id || order.id || idx}>
                      <td style={{ fontWeight: 600 }}>
                        #{order.orderNumber || order.numero || order._id?.slice(-6) || idx + 1}
                      </td>
                      <td>
                        {order.table?.name || order.tableName || order.mesa || '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {formatCurrency(order.total)}
                      </td>
                      <td>
                        <span className="order-status">
                          <span className={`order-status-dot ${statusInfo.dotClass}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        {order.paymentMethod === 'cash' || order.paymentMethod === 'efectivo'
                          ? '💵 Efectivo'
                          : order.paymentMethod === 'card' || order.paymentMethod === 'tarjeta'
                            ? '💳 Tarjeta'
                            : order.paymentMethod || '—'}
                      </td>
                      <td className="text-muted">
                        {formatDate(order.createdAt || order.fecha)}
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
