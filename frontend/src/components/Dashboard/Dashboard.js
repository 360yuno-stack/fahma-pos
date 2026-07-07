import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    ordersCount: 0,
    sales: 0,
    averageTicket: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1> Dashboard</h1>
        <p>Resumen de hoy</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>{stats.ordersCount}</h3>
            <p>Pedidos Hoy</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>{stats.sales.toFixed(2)}€</h3>
            <p>Ventas Totales</p>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>{stats.averageTicket.toFixed(2)}€</h3>
            <p>Ticket Promedio</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>100%</h3>
            <p>Rendimiento</p>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <button className="action-btn primary">
          <span></span>
          Nuevo Pedido
        </button>
        <button className="action-btn success">
          <span></span>
          Ver Mesas
        </button>
        <button className="action-btn info">
          <span></span>
          Ver Productos
        </button>
        <button className="action-btn warning">
          <span></span>
          Reportes
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
