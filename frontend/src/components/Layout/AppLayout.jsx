import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import './AppLayout.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/solicitudes-mesa': 'Solicitudes de Mesa',
  '/tpv': 'Terminal Punto de Venta',
  '/productos': 'Productos',
  '/categorias': 'Categorías',
  '/mesas': 'Mesas',
  '/pedidos': 'Pedidos',
  '/usuarios': 'Usuarios',
  '/cierre-caja': 'Cierre de Caja',
  '/reservas': 'Reservas',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración',
  '/cocina': 'Cocina',
  '/impresoras': 'Impresoras',
  '/verifactu': 'VeriFactu',
  '/clientes': 'Clientes',
  '/gastos': 'Gastos',
  '/turnos': 'Turnos',
  '/asistencia': 'Control Horario / Fichajes',
  '/ingredientes': 'Ingredientes',
  '/proveedores': 'Proveedores',
  '/recetas': 'Recetas'
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || 'FAHMA POS';

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="app-main">
        <header className="app-header">
          <h1>{pageTitle}</h1>
        </header>
        <main className="app-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
