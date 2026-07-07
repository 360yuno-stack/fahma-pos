import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { categoriesAPI, productsAPI, ordersAPI, tablesAPI } from '../services/api';
import './TPV.css';

const IVA_RATE = 0.10;

export default function TPV() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();

  // Categories & Products
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(false);

  // Ticket
  const [ticketLines, setTicketLines] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState('');

  // Tables
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(
    location.state?.tableId || ''
  );
  const [viewMode, setViewMode] = useState(location.state?.tableId ? 'products' : 'tables');

  const groupByZone = (tablesList) => {
    const groups = {};
    tablesList.forEach(t => {
      const zone = t.zone || t.area || t.zona || 'General';
      if (!groups[zone]) groups[zone] = [];
      groups[zone].push(t);
    });
    return groups;
  };

  // Product "added" animation tracking
  const [addedProductId, setAddedProductId] = useState(null);

  // Quick edit product states
  const [quickEditProduct, setQuickEditProduct] = useState(null);
  const [quickEditName, setQuickEditName] = useState('');
  const [quickEditPrice, setQuickEditPrice] = useState('');

  const openQuickEdit = (product) => {
    setQuickEditProduct(product);
    setQuickEditName(product.name || product.nombre || '');
    setQuickEditPrice(product.price ?? product.precio ?? 0);
  };

  const handleSaveQuickEdit = async () => {
    try {
      const pId = quickEditProduct._id || quickEditProduct.id;
      const updated = {
        name: quickEditName,
        price: parseFloat(quickEditPrice) || 0
      };
      await productsAPI.update(pId, updated);
      addToast('Producto actualizado correctamente', 'success');
      setQuickEditProduct(null);
      fetchProducts(); // Refresh products list
    } catch (e) {
      addToast('Error al actualizar el producto', 'error');
    }
  };

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
    fetchTables();
  }, []);

  // Load products when category changes
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedSubCategory]);

  async function fetchCategories() {
    setLoadingCats(true);
    try {
      const res = await categoriesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.categories || []);
      setCategories(list);
    } catch (err) {
      console.error('Error fetching categories:', err);
      addToast('Error al cargar categorías', 'error');
    } finally {
      setLoadingCats(false);
    }
  }

  async function fetchProducts() {
    setLoadingProds(true);
    try {
      const params = {};
      if (selectedSubCategory) {
        params.category = selectedSubCategory._id || selectedSubCategory.id;
      } else if (selectedCategory) {
        params.category = selectedCategory._id || selectedCategory.id;
      }
      const res = await productsAPI.getAll(params);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.products || []);
      setProducts(list);
      if (!selectedCategory && !selectedSubCategory) setAllProducts(list);
    } catch (err) {
      console.error('Error fetching products:', err);
      addToast('Error al cargar productos', 'error');
    } finally {
      setLoadingProds(false);
    }
  }

  async function fetchTables() {
    try {
      const res = await tablesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.tables || []);
      setTables(list);
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  }

  // Filter products by search
  const filteredProducts = products.filter(p => {
    if (p.isAvailable === false) return false;
    if (!searchTerm) return true;
    const name = (p.name || p.nombre || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // Add product to ticket
  function addToTicket(product) {
    const productId = product._id || product.id;
    const productName = product.name || product.nombre || 'Producto';
    const productPrice = product.price ?? product.precio ?? 0;

    setTicketLines(prev => {
      const existing = prev.find(l => l.productId === productId);
      if (existing) {
        return prev.map(l =>
          l.productId === productId ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [...prev, {
        productId,
        name: productName,
        price: productPrice,
        qty: 1
      }];
    });

    // Trigger animation
    setAddedProductId(productId);
    setTimeout(() => setAddedProductId(null), 300);
  }

  function updateQty(productId, delta) {
    setTicketLines(prev =>
      prev
        .map(l => l.productId === productId ? { ...l, qty: l.qty + delta } : l)
        .filter(l => l.qty > 0)
    );
  }

  function removeLine(productId) {
    setTicketLines(prev => prev.filter(l => l.productId !== productId));
  }

  function clearTicket() {
    setTicketLines([]);
    setPaymentMethod('cash');
    setSelectedTableId('');
    setNotes('');
  }

  // Calculations (IVA incluido en el precio)
  const total = ticketLines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const subtotal = total / (1 + IVA_RATE);
  const iva = total - subtotal;

  // Cobrar
  async function handleCobrar() {
    if (ticketLines.length === 0) {
      addToast('Añade productos al ticket', 'warning');
      return;
    }

    setProcessing(true);
    try {
      const orderData = {
        lines: ticketLines.map(l => ({
          product: l.productId,
          name: l.name,
          price: l.price,
          quantity: l.qty,
          subtotal: l.price * l.qty
        })),
        subtotal,
        tax: iva,
        total,
        paymentMethod: paymentMethod === 'cash' ? 'efectivo' : 'tarjeta',
        tableId: selectedTableId || undefined,
        status: 'completed',
        notes
      };

      await ordersAPI.create(orderData);
      addToast(`Pedido cobrado: ${formatCurrency(total)}`, 'success');
      clearTicket();
    } catch (err) {
      console.error('Error creating order:', err);
      addToast('Error al procesar el pedido', 'error');
    } finally {
      setProcessing(false);
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
  }

  function getCategoryColor(cat) {
    return cat.color || cat.colour || '#1976D2';
  }

  function getCategoryIcon(cat) {
    return cat.icon || cat.icono || 'mdi-tag';
  }

  const mainCategories = categories.filter(c => !c.parentCategory);
  
  const getSubcategories = (parentId) => {
    return categories.filter(c => {
       const pId = c.parentCategory?._id || c.parentCategory?.id || c.parentCategory;
       return pId === parentId;
    });
  };

  if (viewMode === 'tables') {
    const grouped = groupByZone(tables);
    return (
      <div className="tpv-tables-view" style={{ padding: '24px', overflowY: 'auto', height: 'calc(100vh - 80px)', backgroundColor: 'var(--color-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text)' }}>Distribución de Mesas</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>Seleccione una mesa para iniciar o gestionar un pedido</p>
          </div>
          <button 
            className="btn btn-primary"
            style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '600' }}
            onClick={() => {
              setSelectedTableId('');
              setViewMode('products');
            }}
          >
            <span className="mdi mdi-walk" style={{ marginRight: 8 }} />
            Para Llevar / Barra
          </button>
        </div>

        {Object.entries(grouped).map(([zone, zoneTables]) => (
          <div key={zone} style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', borderBottom: '2px solid var(--color-border)', paddingBottom: '8px', color: 'var(--color-text)' }}>
              <span className="mdi mdi-map-marker-radius" style={{ marginRight: 8, color: 'var(--color-primary)' }} />
              {zone}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {zoneTables.map(t => {
                const status = (t.status || 'free').toLowerCase();
                let borderLeft = '4px solid var(--color-success)';
                let bg = 'rgba(76, 175, 80, 0.05)';
                let textColor = '#2e7d32';
                let statusLabel = 'Libre';

                if (status === 'occupied' || status === 'ocupada') {
                  borderLeft = '4px solid var(--color-primary)';
                  bg = 'rgba(25, 118, 210, 0.05)';
                  textColor = '#1565c0';
                  statusLabel = 'Ocupada';
                } else if (status === 'reserved' || status === 'reservada') {
                  borderLeft = '4px solid #757575';
                  bg = 'rgba(117, 117, 117, 0.05)';
                  textColor = '#424242';
                  statusLabel = 'Reservada';
                }

                return (
                  <div
                    key={t._id || t.id}
                    style={{
                      background: 'var(--color-bg-white)',
                      border: '1px solid var(--color-border)',
                      borderLeft: borderLeft,
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onClick={() => {
                      setSelectedTableId(t._id || t.id);
                      setViewMode('products');
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--color-text)' }}>{t.name || t.nombre || `Mesa ${t.number}`}</span>
                      <span className="mdi mdi-table-chair" style={{ fontSize: '20px', color: 'var(--color-text-light)' }} />
                    </div>
                    <div style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: bg,
                      color: textColor,
                      textTransform: 'uppercase'
                    }}>
                      {statusLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tpv-layout">
      {/* Left: Categories */}
      <div className="tpv-categories">
        <div className="tpv-categories-header">
          <span className="mdi mdi-shape" />
          Categorías
        </div>
        <div className="tpv-categories-list">
          {/* All categories button */}
          <button
            className={`tpv-category-btn ${selectedCategory === null ? 'tpv-category-btn--active' : ''}`}
            onClick={() => { setSelectedCategory(null); setSelectedSubCategory(null); }}
          >
            <span className="tpv-category-icon mdi mdi-view-grid" />
            <span className="tpv-category-name">Todas</span>
          </button>

          {loadingCats ? (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <div className="spinner spinner-sm" style={{ margin: '0 auto' }} />
            </div>
          ) : (
            mainCategories.map(cat => {
              const catId = cat._id || cat.id;
              const isActive = selectedCategory && (selectedCategory._id || selectedCategory.id) === catId;
              return (
                <button
                  key={catId}
                  className={`tpv-category-btn ${isActive ? 'tpv-category-btn--active' : ''}`}
                  onClick={() => { setSelectedCategory(cat); setSelectedSubCategory(null); }}
                >
                  <div
                    className="tpv-category-color"
                    style={{ backgroundColor: getCategoryColor(cat) }}
                  />
                  <span className={`tpv-category-icon mdi ${getCategoryIcon(cat)}`} />
                  <span className="tpv-category-name">
                    {cat.name || cat.nombre || 'Sin nombre'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Center: Products */}
      <div className="tpv-products">
        <div className="tpv-products-header" style={{ gap: '10px' }}>
          <button 
            className="btn btn-secondary no-print"
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', height: '36px' }}
            onClick={() => {
              setSelectedTableId('');
              setViewMode('tables');
            }}
          >
            <span className="mdi mdi-arrow-left" style={{ marginRight: '6px' }} />
            Mesas
          </button>
          <div className="tpv-search-wrapper" style={{ flex: 1 }}>
            <span className="mdi mdi-magnify" />
            <input
              type="text"
              className="tpv-search-input"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="tpv-products-count">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {selectedCategory && getSubcategories(selectedCategory._id || selectedCategory.id).length > 0 && (
          <div className="tpv-subcategories-row">
            <button
              className={`tpv-subcategory-pill ${!selectedSubCategory ? 'active' : ''}`}
              onClick={() => setSelectedSubCategory(null)}
            >
              Todos
            </button>
            {getSubcategories(selectedCategory._id || selectedCategory.id).map(sub => {
              const subId = sub._id || sub.id;
              const isSubActive = selectedSubCategory && (selectedSubCategory._id || selectedSubCategory.id) === subId;
              return (
                <button
                  key={subId}
                  className={`tpv-subcategory-pill ${isSubActive ? 'active' : ''}`}
                  onClick={() => setSelectedSubCategory(sub)}
                >
                  {sub.name || sub.nombre}
                </button>
              );
            })}
          </div>
        )}

        <div className="tpv-products-grid">
          {loadingProds ? (
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <div className="spinner" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state">
                <span className="empty-state-icon mdi mdi-package-variant" />
                <div className="empty-state-title">Sin productos</div>
                <div className="empty-state-description">
                  {searchTerm
                    ? `No se encontraron productos con "${searchTerm}"`
                    : 'No hay productos en esta categoría'}
                </div>
              </div>
            </div>
          ) : (
            filteredProducts.map(product => {
              const prodId = product._id || product.id;
              const prodName = product.name || product.nombre || 'Producto';
              const prodPrice = product.price ?? product.precio ?? 0;
              const catColor = product.category?.color || product.categoryColor || '#1976D2';

              return (
                <div
                  key={prodId}
                  className={`tpv-product-card ${addedProductId === prodId ? 'tpv-product-card--added' : ''}`}
                  onClick={() => addToTicket(product)}
                >
                  <div className="tpv-product-color-strip" style={{ backgroundColor: catColor }} />
                  <button 
                    className="tpv-quick-edit-btn no-print" 
                    style={{ 
                      position: 'absolute', 
                      top: '6px', 
                      right: '6px', 
                      background: 'rgba(255,255,255,0.85)', 
                      border: 'none', 
                      borderRadius: '50%', 
                      width: '24px', 
                      height: '24px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                      zIndex: 2
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openQuickEdit(product);
                    }}
                  >
                    <span className="mdi mdi-pencil" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }} />
                  </button>
                  <div className="tpv-product-name" style={{ paddingRight: '20px' }}>{prodName}</div>
                  <div className="tpv-product-price">{formatCurrency(prodPrice)}</div>
                  {product.category?.name && (
                    <div className="tpv-product-category">
                      {product.category.name || product.category.nombre}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Ticket */}
      <div className="tpv-ticket">
        <div className="tpv-ticket-header">
          <div className="tpv-ticket-title">
            <span className="mdi mdi-receipt" />
            Ticket
          </div>
          <select
            className="tpv-table-selector"
            value={selectedTableId}
            onChange={e => setSelectedTableId(e.target.value)}
          >
            <option value="">Sin mesa asignada</option>
            {tables.map(t => (
              <option key={t._id || t.id} value={t._id || t.id}>
                {t.name || t.nombre || `Mesa ${t.number || t.numero || ''}`}
              </option>
            ))}
          </select>
        </div>

        {/* Ticket Items */}
        <div className="tpv-ticket-items">
          {ticketLines.length === 0 ? (
            <div className="tpv-ticket-empty">
              <span className="mdi mdi-cart-outline" />
              <p>Añade productos al ticket</p>
            </div>
          ) : (
            ticketLines.map(line => (
              <div key={line.productId} className="tpv-ticket-line">
                <div className="tpv-ticket-line-info">
                  <div className="tpv-ticket-line-name">{line.name}</div>
                  <div className="tpv-ticket-line-price">
                    {formatCurrency(line.price)} /ud
                  </div>
                </div>

                <div className="tpv-ticket-line-qty">
                  <button
                    className="tpv-qty-btn"
                    onClick={() => updateQty(line.productId, -1)}
                  >
                    <span className="mdi mdi-minus" />
                  </button>
                  <span className="tpv-qty-value">{line.qty}</span>
                  <button
                    className="tpv-qty-btn"
                    onClick={() => updateQty(line.productId, 1)}
                  >
                    <span className="mdi mdi-plus" />
                  </button>
                </div>

                <span className="tpv-ticket-line-total">
                  {formatCurrency(line.price * line.qty)}
                </span>

                <button
                  className="tpv-ticket-line-delete"
                  onClick={() => removeLine(line.productId)}
                >
                  <span className="mdi mdi-delete-outline" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="tpv-ticket-footer">
          {/* Notes / Annotation */}
          <div className="tpv-ticket-notes" style={{ marginBottom: '12px' }}>
            <textarea
              className="form-textarea"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                resize: 'none',
                height: '45px',
                fontFamily: 'inherit'
              }}
              placeholder="Anotación / Notas de impresión..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          {/* Summary */}
          <div className="tpv-ticket-summary">
            <div className="tpv-ticket-summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="tpv-ticket-summary-row">
              <span>IVA (10%)</span>
              <span>{formatCurrency(iva)}</span>
            </div>
            <div className="tpv-ticket-summary-row tpv-ticket-summary-row--total">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Method Toggle */}
          <div className="tpv-payment-toggle">
            <button
              className={`tpv-payment-option ${paymentMethod === 'cash' ? 'tpv-payment-option--active' : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <span className="mdi mdi-cash" />
              Efectivo
            </button>
            <button
              className={`tpv-payment-option ${paymentMethod === 'card' ? 'tpv-payment-option--active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <span className="mdi mdi-credit-card" />
              Tarjeta
            </button>
          </div>

          {/* Cobrar Button */}
          <button
            className="tpv-cobrar-btn"
            onClick={handleCobrar}
            disabled={ticketLines.length === 0 || processing}
          >
            {processing ? (
              <>
                <div className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                Procesando...
              </>
            ) : (
              <>
                <span className="mdi mdi-check-circle" />
                Cobrar {total > 0 ? formatCurrency(total) : ''}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {quickEditProduct && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-container" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Producto</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={() => setQuickEditProduct(null)} />
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input
                  type="text"
                  className="form-input"
                  value={quickEditName}
                  onChange={(e) => setQuickEditName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Precio (€)</label>
                <input
                  type="number"
                  className="form-input"
                  value={quickEditPrice}
                  onChange={(e) => setQuickEditPrice(e.target.value)}
                  step="0.01"
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setQuickEditProduct(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveQuickEdit}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
