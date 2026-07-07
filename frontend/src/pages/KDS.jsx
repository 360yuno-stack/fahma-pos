import { useState, useEffect, useRef } from 'react';
import { ordersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './KDS.css';

function KDS() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    intervalRef.current = setInterval(() => { fetchOrders(); setNow(new Date()); }, 15000);
    const clockInterval = setInterval(() => setNow(new Date()), 60000);
    return () => { clearInterval(intervalRef.current); clearInterval(clockInterval); };
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getAll({ status: 'pending' });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const res2 = await ordersAPI.getAll({ status: 'preparing' });
      const list2 = Array.isArray(res2.data) ? res2.data : (res2.data?.data || []);
      setOrders([...list, ...list2]);
    } catch (err) {
      console.error('KDS fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await ordersAPI.updateStatus(id, { status });
      addToast(status === 'preparing' ? 'Pedido en preparación' : 'Pedido listo', 'success');
      fetchOrders();
    } catch (err) {
      addToast('Error al actualizar pedido', 'error');
    }
  };

  const getElapsed = (date) => {
    const diff = Math.floor((now - new Date(date)) / 60000);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return <div className="kds-page"><div className="loading-container"><div className="spinner" /><div className="loading-text" style={{color: '#fff'}}>Cargando cocina...</div></div></div>;
  }

  return (
    <div className="kds-page">
      <div className="kds-header">
        <div className="kds-header-left">
          <span className="mdi mdi-stove kds-header-icon" />
          <h1>Cocina - Pedidos</h1>
        </div>
        <div className="kds-header-right">
          <span className="kds-time">{currentTime}</span>
          <span className="kds-count badge badge-warning">{orders.length} pedidos</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="kds-empty">
          <span className="mdi mdi-chef-hat kds-empty-icon" />
          <h2>Sin pedidos pendientes</h2>
          <p>Los nuevos pedidos aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="kds-grid">
          {orders.map(order => (
            <div key={order._id} className={`kds-card ${order.status === 'preparing' ? 'kds-card-preparing' : 'kds-card-pending'}`}>
              <div className="kds-card-header">
                <span className="kds-order-number">#{order.orderNumber || '—'}</span>
                <span className={`badge ${order.status === 'preparing' ? 'badge-primary' : 'badge-warning'}`}>
                  {order.status === 'preparing' ? 'Preparando' : 'Pendiente'}
                </span>
              </div>
              <div className="kds-card-table">
                <span className="mdi mdi-table-furniture" /> {order.table?.name || 'Sin mesa'}
              </div>
              <div className="kds-card-items">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="kds-item">
                    <span className="kds-item-qty">{item.quantity}x</span>
                    <span className="kds-item-name">{item.name}</span>
                  </div>
                ))}
              </div>
              <div className="kds-card-footer">
                <span className="kds-elapsed">
                  <span className="mdi mdi-clock-outline" /> {getElapsed(order.createdAt)}
                </span>
                <div className="kds-actions">
                  {order.status === 'pending' && (
                    <button className="btn btn-sm btn-primary" onClick={() => updateStatus(order._id, 'preparing')}>
                      <span className="mdi mdi-fire" /> Preparando
                    </button>
                  )}
                  <button className="btn btn-sm btn-success" onClick={() => updateStatus(order._id, 'served')}>
                    <span className="mdi mdi-check" /> Listo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KDS;
