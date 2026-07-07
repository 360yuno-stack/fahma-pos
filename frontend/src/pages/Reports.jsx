import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Reports.css';

export default function Reports() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      
      const res = await dashboardAPI.getStats(params);
      setStats(res.data?.data || res.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar reportes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!stats) return;

    // Generar contenido CSV con formato semi-colon para compatibilidad directa con Excel en español
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM para acentos
    
    // Encabezado
    csvContent += `REPORTE DE VENTAS - FAHMA POS\n`;
    csvContent += `Rango de Fechas:;${dateFrom || 'Inicio'} al ${dateTo || 'Fin'}\n\n`;
    
    // Tabla Resumen
    csvContent += `Metrica;Valor\n`;
    csvContent += `Ventas Totales;${Number(stats.totalSales || 0).toFixed(2)} EUR\n`;
    csvContent += `Total Pedidos;${stats.totalOrders || 0}\n`;
    csvContent += `Ticket Promedio;${Number(stats.avgTicket || 0).toFixed(2)} EUR\n`;
    csvContent += `Ventas Efectivo;${Number(stats.cashSales || 0).toFixed(2)} EUR\n`;
    csvContent += `Ventas Tarjeta;${Number(stats.cardSales || 0).toFixed(2)} EUR\n`;
    csvContent += `IVA Recaudado (10%);${Number(stats.totalTaxes || 0).toFixed(2)} EUR\n\n`;
    
    // Tabla de más vendidos
    csvContent += `PRODUCTOS MAS VENDIDOS\n`;
    csvContent += `Posicion;Producto;Unidades Vendidas;Ingresos Totales\n`;
    
    if (stats.topProducts && stats.topProducts.length > 0) {
      stats.topProducts.forEach((p, idx) => {
        csvContent += `${idx + 1};${p.name};${p.quantity};${Number(p.revenue || 0).toFixed(2)} EUR\n`;
      });
    } else {
      csvContent += `;-;No hay datos;-\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_contabilidad_${dateFrom || 'todo'}_${dateTo || 'todo'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Reporte exportado correctamente', 'success');
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><div className="loading-text">Cargando...</div></div>;
  }

  const totalSales = stats?.totalSales || stats?.revenue || 0;
  const totalOrders = stats?.totalOrders || 0;
  const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  const statCards = [
    { icon: 'mdi-cash-register', color: 'var(--color-success)', bg: 'var(--color-success-bg)', value: `€${Number(totalSales).toFixed(2)}`, label: 'Ventas Totales' },
    { icon: 'mdi-receipt', color: 'var(--color-primary)', bg: 'var(--color-primary-bg)', value: totalOrders, label: 'Total Pedidos' },
    { icon: 'mdi-chart-line', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', value: `€${Number(avgTicket).toFixed(2)}`, label: 'Ticket Promedio' },
    { icon: 'mdi-credit-card-outline', color: 'var(--color-info)', bg: 'var(--color-info-bg)', value: `€${Number(stats?.cashSales || 0).toFixed(2)} / €${Number(stats?.cardSales || 0).toFixed(2)}`, label: 'Efectivo / Tarjeta' },
    { icon: 'mdi-percent', color: '#e91e63', bg: 'rgba(233, 30, 99, 0.1)', value: `€${Number(stats?.totalTaxes || 0).toFixed(2)}`, label: 'IVA Recaudado (10%)' },
  ];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Resumen de ventas y estadísticas</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }} className="no-print">
          <button className="btn btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="mdi mdi-printer" /> Imprimir
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#2e7d32', borderColor: '#2e7d32', color: '#fff' }}>
            <span className="mdi mdi-download" /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="filter-bar no-print">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Desde</label>
          <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Hasta</label>
          <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={fetchStats} style={{ alignSelf: 'flex-end' }}>
          <span className="mdi mdi-filter" /> Aplicar
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              <span className={`mdi ${card.icon}`} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="mdi mdi-trophy" style={{ marginRight: '8px', color: 'var(--color-warning)' }} />
            Productos Más Vendidos
          </h3>
        </div>
        {stats?.topProducts && stats.topProducts.length > 0 ? (
          <ul className="top-products-list">
            {stats.topProducts.map((product, idx) => (
              <li className="top-product-item" key={idx}>
                <span className="top-product-rank">{idx + 1}</span>
                <span className="top-product-name">{product.name || product.productName || 'Producto'}</span>
                <span className="top-product-qty">{product.quantity || product.count || 0} uds.</span>
                <span className="top-product-revenue">€{Number(product.revenue || product.total || 0).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="placeholder-message">
            <span className="mdi mdi-chart-bar" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', opacity: 0.4 }} />
            Los datos de productos más vendidos aparecerán aquí
          </p>
        )}
      </div>
    </div>
  );
}
