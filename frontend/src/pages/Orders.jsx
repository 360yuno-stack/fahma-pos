import { useState, useEffect } from 'react';
import api, { ordersAPI, settingsAPI, productsAPI, clientsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Orders.css';

const statusConfig = {
  pending: { label: 'Pendiente', badge: 'badge-warning' },
  preparing: { label: 'Preparando', badge: 'badge-info' },
  served: { label: 'Servido', badge: 'badge-success' },
  completed: { label: 'Pagado', badge: 'badge-gray' },
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

  // Email invoice states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailingOrder, setEmailingOrder] = useState(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Edit order states (Modificar ticket cobrado)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [allProductsList, setAllProductsList] = useState([]);
  const [selectedAddProductId, setSelectedAddProductId] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    items: [],
    paymentMethod: 'cash',
    notes: '',
    customer: {
      name: '',
      nif: '',
      email: '',
      phone: '',
      address: ''
    }
  });

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

  // Imprimir Ticket Normal de Venta
  const handlePrintTicket = async (order) => {
    try {
      await api.post(`/orders/${order._id}/print`, { type: 'receipt' });
      addToast('Ticket enviado a la impresora', 'success');
    } catch (err) {
      console.warn('Fallo de impresión directa, recurriendo a impresión de navegador:', err);
      
      const printWindow = window.open('', '_blank', 'width=600,height=800');
      const orderNum = getOrderNumber(order);
      const itemsHtml = (order.items || []).map(item => `
        <tr>
          <td style="padding: 5px 0;">${item.name || item.product?.name || 'Producto'} ${item.modifiers?.length ? `<br/><small>(${item.modifiers.join(', ')})</small>` : ''}</td>
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
          <body onload="window.print(); window.close();">
            <h2 style="font-size: 16px; text-transform: uppercase; margin-bottom: 2px;">${settings?.restaurantName || 'EL FOGON DEL AGUILA'}</h2>
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
    }
  };

  // Imprimir Factura Completa Formal con Datos del Cliente
  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank', 'width=800,height=950');
    const orderNum = getOrderNumber(order);
    const customer = order.customer || {};
    const subtotal = (order.subtotal || (order.total / 1.10)).toFixed(2);
    const taxes = (order.taxes || (order.total - (order.total / 1.10))).toFixed(2);
    const total = order.total.toFixed(2);

    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
          <strong>${item.name || item.product?.name || 'Producto'}</strong>
          ${item.modifiers?.length ? `<br/><small style="color: #64748b;">${item.modifiers.join(', ')}</small>` : ''}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">€${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">€${((item.quantity || 1) * item.price).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Factura F-${new Date(order.createdAt).getFullYear()}/${orderNum}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 40px; font-size: 14px; background: #fff; }
            .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }
            .restaurant-info h1 { margin: 0 0 5px 0; font-size: 24px; color: #0f172a; text-transform: uppercase; }
            .restaurant-info p { margin: 2px 0; color: #64748b; font-size: 13px; }
            .invoice-title-block { text-align: right; }
            .invoice-title-block h2 { margin: 0; font-size: 20px; color: #2563eb; }
            .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; }
            .client-details p { margin: 3px 0; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { background: #f1f5f9; color: #334155; padding: 10px 8px; text-align: left; font-weight: 600; font-size: 13px; border-bottom: 2px solid #cbd5e1; }
            .totals-table { width: 280px; margin-left: auto; font-size: 14px; }
            .totals-table td { padding: 6px 0; }
            .totals-table tr.total-row td { border-top: 2px solid #0f172a; font-size: 18px; font-weight: bold; padding-top: 10px; color: #0f172a; }
            .footer-note { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="invoice-header">
            <div class="restaurant-info">
              <h1>${settings?.restaurantName || 'EL FOGON DEL AGUILA'}</h1>
              ${settings?.nif ? `<p>NIF / CIF: ${settings.nif}</p>` : ''}
              ${settings?.address ? `<p>Dirección: ${settings.address}</p>` : ''}
              ${settings?.phone ? `<p>Teléfono: ${settings.phone}</p>` : ''}
            </div>
            <div class="invoice-title-block">
              <h2>FACTURA COMPLETA</h2>
              <p style="margin: 5px 0; font-weight: bold;">Nº: F-${new Date(order.createdAt).getFullYear()}/${orderNum}</p>
              <p style="margin: 2px 0; color: #64748b;">Fecha: ${new Date(order.paidAt || order.createdAt).toLocaleDateString('es-ES')}</p>
            </div>
          </div>

          <div class="client-box">
            <div class="client-details">
              <strong style="color: #475569; text-transform: uppercase; font-size: 11px; display: block; margin-bottom: 4px;">DATOS DEL CLIENTE DE LA FACTURA</strong>
              <p style="font-size: 15px; font-weight: bold; margin-bottom: 4px;">${customer.name || 'Cliente de Contado'}</p>
              ${customer.nif ? `<p>NIF / CIF: <strong>${customer.nif}</strong></p>` : ''}
              ${customer.address ? `<p>Dirección: ${customer.address}</p>` : ''}
              ${customer.phone ? `<p>Teléfono: ${customer.phone}</p>` : ''}
              ${customer.email ? `<p>Email: ${customer.email}</p>` : ''}
            </div>
            <div style="text-align: right; font-size: 13px; color: #64748b;">
              <p>Forma de Pago: <strong>${(order.paymentMethod === 'card' || order.paymentMethod === 'tarjeta') ? 'Tarjeta' : 'Efectivo'}</strong></p>
              ${order.table ? `<p>Mesa: <strong>${order.table.name || `Mesa ${order.table.number}`}</strong></p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Concepto / Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Ud.</th>
                <th style="text-align: right;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td>Base Imponible:</td>
              <td style="text-align: right;">€${subtotal}</td>
            </tr>
            <tr>
              <td>IVA (10% Incluido):</td>
              <td style="text-align: right;">€${taxes}</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL FACTURA:</td>
              <td style="text-align: right;">€${total}</td>
            </tr>
          </table>

          <div class="footer-note">
            <p>${settings?.ticketFooterText || '¡Muchas gracias por su confianza!'}</p>
            ${order.verifactuHash ? `<p style="font-size: 10px; font-family: monospace;">SISTEMA VERIFACTU (AEAT) - Ref: ${order.verifactuHash.substring(0, 20).toUpperCase()}</p>` : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  // Enviar Factura por Email
  const openEmailModal = (order) => {
    setEmailingOrder(order);
    setTargetEmail(order.customer?.email || '');
    setShowEmailModal(true);
  };

  const handleSendEmailInvoice = async (e) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      addToast('Indica un correo electrónico válido', 'warning');
      return;
    }
    try {
      setSendingEmail(true);
      const res = await ordersAPI.emailInvoice(emailingOrder._id, { targetEmail });
      addToast(res.data?.message || `Factura enviada a ${targetEmail}`, 'success');
      setShowEmailModal(false);
      setEmailingOrder(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al enviar la factura por email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Modificar Ticket Cobrado (Request 3)
  const openEditModal = async (order) => {
    setEditingOrder(order);
    try {
      const res = await productsAPI.getAll();
      setAllProductsList(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (e) {
      console.error('Error fetching products for edit modal:', e);
    }
    setEditForm({
      items: (order.items || []).map(i => ({
        product: i.product?._id || i.product || i.id,
        name: i.name || i.product?.name || 'Producto',
        price: i.price || 0,
        quantity: i.quantity || 1,
        modifiers: i.modifiers || []
      })),
      paymentMethod: order.paymentMethod || 'cash',
      notes: order.notes || '',
      customer: {
        name: order.customer?.name || '',
        nif: order.customer?.nif || '',
        email: order.customer?.email || '',
        phone: order.customer?.phone || '',
        address: order.customer?.address || ''
      }
    });
    setShowEditModal(true);
  };

  const handleAddProductToEditOrder = () => {
    if (!selectedAddProductId) return;
    const prod = allProductsList.find(p => (p._id || p.id) === selectedAddProductId);
    if (!prod) return;

    setEditForm(prev => {
      const existingIdx = prev.items.findIndex(i => i.product === (prod._id || prod.id));
      if (existingIdx > -1) {
        const updated = [...prev.items];
        updated[existingIdx].quantity += 1;
        return { ...prev, items: updated };
      } else {
        return {
          ...prev,
          items: [
            ...prev.items,
            {
              product: prod._id || prod.id,
              name: prod.name || prod.nombre,
              price: prod.price || 0,
              quantity: 1,
              modifiers: []
            }
          ]
        };
      }
    });
    setSelectedAddProductId('');
  };

  const handleUpdateEditItemQty = (index, delta) => {
    setEditForm(prev => {
      const updated = prev.items.map((item, idx) => {
        if (idx === index) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
      return { ...prev, items: updated };
    });
  };

  const handleSaveEditOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      setSavingEdit(true);
      const computedTotal = editForm.items.reduce((s, i) => s + (i.price * i.quantity), 0);
      const payload = {
        items: editForm.items,
        total: computedTotal,
        paymentMethod: editForm.paymentMethod,
        notes: editForm.notes,
        customer: editForm.customer
      };
      await ordersAPI.update(editingOrder._id, payload);
      addToast('Pedido modificado y guardado correctamente', 'success');
      setShowEditModal(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al modificar el pedido', 'error');
    } finally {
      setSavingEdit(false);
    }
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
          <h1 className="page-title">Pedidos / Ventas</h1>
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
                  <th>Cliente</th>
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
                      <td>
                        {order.customer?.name ? (
                          <span>
                            <strong>{order.customer.name}</strong>
                            {order.customer.nif ? <small style={{ display: 'block', color: '#64748b' }}>{order.customer.nif}</small> : ''}
                          </span>
                        ) : '-'}
                      </td>
                      <td>{order.items?.length || 0}</td>
                      <td><strong>{formatCurrency(order.total)}</strong></td>
                      <td><span className={`badge ${status.badge}`}>{status.label}</span></td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleViewDetail(order)} title="Ver Detalle">
                            <span className="mdi mdi-eye" />
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(order)} title="Modificar Ticket">
                            <span className="mdi mdi-pencil" />
                          </button>
                          <button className="btn btn-sm btn-primary" onClick={() => handlePrintInvoice(order)} title="Imprimir Factura">
                            <span className="mdi mdi-file-document" />
                          </button>
                          <button className="btn btn-sm btn-info" style={{ background: '#0284c7', color: '#fff' }} onClick={() => openEmailModal(order)} title="Enviar por Email">
                            <span className="mdi mdi-email-outline" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detalle Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-container" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle del Pedido #{getOrderNumber(selectedOrder)}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={handleCloseDetail} />
            </div>
            <div className="modal-body">
              <div className="order-detail-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '16px' }}>
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
                  <div className="order-detail-label">Cliente</div>
                  <div className="order-detail-value">{selectedOrder.customer?.name || 'Cliente de Contado'}</div>
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

              {selectedOrder.customer?.nif && (
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <strong>Datos Facturación Cliente:</strong> {selectedOrder.customer.name} | NIF: {selectedOrder.customer.nif} {selectedOrder.customer.email ? `| Email: ${selectedOrder.customer.email}` : ''}
                </div>
              )}

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
                      <td>
                        {item.product?.name || item.name || '-'}
                        {item.modifiers?.length ? <small style={{ display: 'block', color: '#64748b' }}>({item.modifiers.join(', ')})</small> : ''}
                      </td>
                      <td>{item.quantity || 0}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="order-total-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div className="order-detail-notes-block" style={{ flex: 1, textAlign: 'left', paddingRight: '20px' }}>
                  {selectedOrder.notes ? (
                    <div style={{ padding: '8px 12px', background: 'var(--color-warning-bg)', color: 'var(--color-text)', borderRadius: '6px', borderLeft: '3px solid var(--color-warning)', fontSize: '13px' }}>
                      <strong>Notas:</strong> {selectedOrder.notes}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>Sin anotaciones</span>
                  )}
                </div>
                <span className="total-amount" style={{ whiteSpace: 'nowrap' }}>Total: {formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => handlePrintTicket(selectedOrder)}>
                <span className="mdi mdi-printer" style={{ marginRight: '4px' }} />
                Ticket
              </button>
              <button className="btn btn-primary" onClick={() => handlePrintInvoice(selectedOrder)}>
                <span className="mdi mdi-file-document" style={{ marginRight: '4px' }} />
                Factura Completa
              </button>
              <button className="btn btn-info" style={{ background: '#0284c7', color: '#fff' }} onClick={() => openEmailModal(selectedOrder)}>
                <span className="mdi mdi-email-outline" style={{ marginRight: '4px' }} />
                Enviar Email
              </button>
              <button className="btn btn-ghost" onClick={handleCloseDetail}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enviar Factura por Email Modal */}
      {showEmailModal && emailingOrder && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-container" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enviar Factura por Correo</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={() => setShowEmailModal(false)} />
            </div>
            <form onSubmit={handleSendEmailInvoice}>
              <div className="modal-body" style={{ padding: '16px' }}>
                <p style="fontSize: 14px; margin-bottom: 12px;">Se enviará la Factura N° F-{new Date(emailingOrder.createdAt).getFullYear()}/{getOrderNumber(emailingOrder)} con el desglose al siguiente email:</p>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico del Cliente</label>
                  <input
                    type="email"
                    className="form-input"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={sendingEmail}>
                  {sendingEmail ? 'Enviando...' : 'Enviar Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modificar Ticket Cobrado Modal (Request 3) */}
      {showEditModal && editingOrder && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" style={{ maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modificar Pedido / Ticket #{getOrderNumber(editingOrder)}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={() => setShowEditModal(false)} />
            </div>
            <form onSubmit={handleSaveEditOrder} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Añadir Producto al pedido */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Añadir o cambiar un producto:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      className="form-select"
                      style={{ flex: 1 }}
                      value={selectedAddProductId}
                      onChange={(e) => setSelectedAddProductId(e.target.value)}
                    >
                      <option value="">-- Seleccionar producto para agregar --</option>
                      {allProductsList.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.name || p.nombre} (€{(p.price || 0).toFixed(2)})
                        </option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-primary" onClick={handleAddProductToEditOrder} disabled={!selectedAddProductId}>
                      + Añadir
                    </button>
                  </div>
                </div>

                {/* Lista de productos actuales */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Líneas de la Venta:</h3>
                  <table className="order-items-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th style={{ textStyle: 'center' }}>Cant</th>
                        <th style={{ textAlign: 'right' }}>P. Ud</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editForm.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button type="button" className="btn-icon btn-ghost" style={{ width: '24px', height: '24px' }} onClick={() => handleUpdateEditItemQty(idx, -1)}>-</button>
                              <strong>{item.quantity}</strong>
                              <button type="button" className="btn-icon btn-ghost" style={{ width: '24px', height: '24px' }} onClick={() => handleUpdateEditItemQty(idx, 1)}>+</button>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>€{item.price.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>€{(item.quantity * item.price).toFixed(2)}</td>
                          <td>
                            <button type="button" className="btn-icon btn-ghost" style={{ color: '#ef4444' }} onClick={() => handleUpdateEditItemQty(idx, -item.quantity)}>
                              <span className="mdi mdi-delete" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Datos del Cliente y Forma de Pago */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Datos del Cliente (para la Factura):</h3>
                  <div className="form-row" style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Nombre / Empresa</label>
                      <input type="text" className="form-input" value={editForm.customer.name} onChange={e => setEditForm({...editForm, customer: {...editForm.customer, name: e.target.value}})} placeholder="Nombre cliente" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">NIF / CIF</label>
                      <input type="text" className="form-input" value={editForm.customer.nif} onChange={e => setEditForm({...editForm, customer: {...editForm.customer, nif: e.target.value}})} placeholder="12345678X" />
                    </div>
                  </div>
                  <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Email</label>
                      <input type="email" className="form-input" value={editForm.customer.email} onChange={e => setEditForm({...editForm, customer: {...editForm.customer, email: e.target.value}})} placeholder="correo@ejemplo.com" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Forma de Pago</label>
                      <select className="form-select" value={editForm.paymentMethod} onChange={e => setEditForm({...editForm, paymentMethod: e.target.value})}>
                        <option value="cash">Efectivo</option>
                        <option value="card">Tarjeta</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', color: '#fff', padding: '12px 16px', borderRadius: '8px', marginTop: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Nuevo Total Recalculado:</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                    €{editForm.items.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit || editForm.items.length === 0}>
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios en Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
