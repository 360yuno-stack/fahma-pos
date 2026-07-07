import { useState, useEffect } from 'react';
import { ordersAPI, settingsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Orders.css';

const statusConfig = {
  pending: { label: 'Pendiente', badge: 'badge-warning' },
  preparing: { label: 'Preparando', badge: 'badge-info' },
  served: { label: 'Servido', badge: 'badge-success' },
  paid: { label: 'Pagado', badge: 'badge-gray' },
  cancelled: { label: 'Cancelado', badge: 'badge-danger' },
};

export default function Orders() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersAPI.getAll({
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setOrders(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar los pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const getOrderNumber = (order) => {
    if (order.orderNumber) return order.orderNumber;
    if (order._id) return order._id.slice(-6).toUpperCase();
    return '------';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const formatCurrency = (amount) => {
    return `€${(amount || 0).toFixed(2)}`;
  };

  const handlePrintTicket = (order) => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    const orderNum = order.orderNumber || order._id.slice(-6).toUpperCase();
    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td style="padding: 5px 0;">${item.name || item.product?.name || 'Producto'}</td>
        <td style="padding: 5px 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 5px 0; text-align: right;">€${item.price.toFixed(2)}</td>
        <td style="padding: 5px 0; text-align: right;">€${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join('');

    const notesHtml = order.notes ? `
      <div style="border-top: 1px dashed #000; padding: 10px 0; font-size: 14px; margin-top: 10px;">
        <strong>ANOTACIÓN:</strong> ${order.notes}
      </div>
    ` : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket #${orderNum}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 280px; margin: 0 auto; padding: 10px; font-size: 12px; }
            h2 { text-align: center; margin: 5px 0; }
            .center { text-align: center; }
            .right { text-align: right; }
            table { width: 100%; border-collapse: collapse; }
            .border-top { border-top: 1px dashed #000; }
            .border-bottom { border-bottom: 1px dashed #000; }
          </style>
        </head>
        <body>
          <h2 style="font-size: 16px; text-transform: uppercase; margin-bottom: 2px;">${settings?.restaurantName || 'EL FOGÓN DEL ÁGUILA'}</h2>
          ${settings?.nif ? `<div class="center">NIF: ${settings.nif}</div>` : ''}
          ${settings?.address ? `<div class="center" style="font-size: 11px;">${settings.address}</div>` : ''}
          ${settings?.phone ? `<div class="center">Tel: ${settings.phone}</div>` : ''}
          <div class="center" style="margin-top: 5px; font-weight: bold;">Ticket #${orderNum}</div>
          <div class="center">Fecha: ${new Date(order.createdAt).toLocaleString('es-ES')}</div>
          <div class="center">Mesa: ${order.table?.number ? `Mesa ${order.table.number}` : (order.tableName || 'Sin mesa')}</div>
          <br/>
          <table>
            <thead>
              <tr class="border-bottom">
                <th style="text-align: left;">Item</th>
                <th>Cant</th>
                <th style="text-align: right;">P.Ud</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <br/>
          <div class="border-top" style="padding: 5px 0;">
            <table style="font-weight: bold; width: 100%;">
              <tr>
                <td>Subtotal (S/I):</td>
                <td class="right">€${(order.subtotal || (order.total / 1.10)).toFixed(2)}</td>
              </tr>
              <tr>
                <td>IVA (10% Inc):</td>
                <td class="right">€${(order.taxes || (order.total - (order.total / 1.10))).toFixed(2)}</td>
              </tr>
              <tr style="font-size: 14px;">
                <td>TOTAL:</td>
                <td class="right">€${order.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          ${notesHtml}
          <br/>
          <div class="center" style="font-size: 11px; font-weight: bold; white-space: pre-wrap;">${settings?.ticketFooterText || '¡Gracias por su visita!'}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">{orders.length} pedidos registrados</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="filter-bar" style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
            <label className="form-label">Desde</label>
            <input
              className="form-input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
            <label className="form-label">Hasta</label>
            <input
              className="form-input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
            <label className="form-label">Estado</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-receipt" />
          <h3 className="empty-state-title">Sin pedidos</h3>
          <p className="empty-state-description">No hay pedidos registrados</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th># Pedido</th>
                  <th>Mesa</th>
                  <th>Camarero</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const status = statusConfig[order.status] || { label: order.status, badge: 'badge-gray' };
                  return (
                    <tr key={order._id}>
                      <td>
                        <span className="order-number">{getOrderNumber(order)}</span>
                      </td>
                      <td>{order.table?.number ? `Mesa ${order.table.number}` : (order.tableName || '-')}</td>
                      <td>{order.waiter?.name || order.waiterName || '-'}</td>
                      <td>{order.items?.length || 0}</td>
                      <td><strong>{formatCurrency(order.total)}</strong></td>
                      <td><span className={`badge ${status.badge}`}>{status.label}</span></td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleViewDetail(order)}>
                          <span className="mdi mdi-eye" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle del Pedido</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={handleCloseDetail} />
            </div>
            <div className="modal-body">
              <div className="order-detail-header">
                <div>
                  <div className="order-detail-label"># Pedido</div>
                  <div className="order-detail-value order-number">{getOrderNumber(selectedOrder)}</div>
                </div>
                <div>
                  <div className="order-detail-label">Mesa</div>
                  <div className="order-detail-value">
                    {selectedOrder.table?.number ? `Mesa ${selectedOrder.table.number}` : (selectedOrder.tableName || '-')}
                  </div>
                </div>
                <div>
                  <div className="order-detail-label">Camarero</div>
                  <div className="order-detail-value">{selectedOrder.waiter?.name || selectedOrder.waiterName || '-'}</div>
                </div>
                <div>
                  <div className="order-detail-label">Estado</div>
                  <div className="order-detail-value">
                    <span className={`badge ${(statusConfig[selectedOrder.status] || {}).badge || 'badge-gray'}`}>
                      {(statusConfig[selectedOrder.status] || {}).label || selectedOrder.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="order-detail-label">Fecha</div>
                  <div className="order-detail-value">{formatDate(selectedOrder.createdAt)}</div>
                </div>
              </div>

              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Ud.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product?.name || item.name || '-'}</td>
                      <td>{item.quantity || 0}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="order-total-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="order-detail-notes-block" style={{ flex: 1, textAlign: 'left', paddingRight: '20px' }}>
                  {selectedOrder.notes ? (
                    <div style={{ padding: '8px 12px', background: 'var(--color-warning-bg)', color: 'var(--color-text)', borderRadius: '6px', borderLeft: '3px solid var(--color-warning)', fontSize: '13px' }}>
                      <strong>Notas de Impresión:</strong> {selectedOrder.notes}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>Sin anotaciones</span>
                  )}
                </div>
                <span className="total-amount" style={{ whiteSpace: 'nowrap' }}>Total: {formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button className="btn btn-primary" onClick={() => handlePrintTicket(selectedOrder)}>
                <span className="mdi mdi-printer" style={{ marginRight: '6px' }} />
                Imprimir Ticket
              </button>
              <button className="btn btn-secondary" onClick={handleCloseDetail}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
