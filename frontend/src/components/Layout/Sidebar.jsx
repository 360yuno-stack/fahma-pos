import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ClockInModal from './ClockInModal';
import './Sidebar.css';

export default function Sidebar({ collapsed, onToggle }) {
  const [cartaOpen, setCartaOpen] = useState(false);
  const [equipoOpen, setEquipoOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [fidelOpen, setFidelOpen] = useState(false);
  const [informesOpen, setInformesOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [clockInOpen, setClockInOpen] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { to: '/dashboard', icon: 'mdi-view-dashboard', label: 'Dashboard' },
    { to: '/tpv', icon: 'mdi-cash-register', label: 'TPV (Mesas)' },
    { to: '/pedidos', icon: 'mdi-receipt', label: 'Pedidos' },
    { to: '/cocina', icon: 'mdi-stove', label: 'Cocina (KDS)' },
  ];

  const cartaItems = [
    { to: '/productos', icon: 'mdi-food-variant', label: 'Productos' },
    { to: '/categorias', icon: 'mdi-tag-multiple', label: 'Categorías' },
    { to: '/modificadores', icon: 'mdi-tune', label: 'Modificadores' },
  ];

  const stockItems = [
    { to: '/ingredientes', icon: 'mdi-shaker', label: 'Ingredientes' },
    { to: '/recetas', icon: 'mdi-notebook', label: 'Recetas' },
    { to: '/proveedores', icon: 'mdi-truck', label: 'Proveedores' },
  ];

  const equipoItems = [
    { to: '/usuarios', icon: 'mdi-account-group', label: 'Usuarios' },
    { to: '/turnos', icon: 'mdi-clock-start', label: 'Turnos' },
    { to: '/asistencia', icon: 'mdi-clock-outline', label: 'Fichajes' },
  ];

  const fidelItems = [
    { to: '/clientes', icon: 'mdi-account-multiple', label: 'Clientes' },
    { to: '/reservas', icon: 'mdi-calendar-clock', label: 'Reservas' },
  ];

  const informesItems = [
    { to: '/reportes', icon: 'mdi-chart-bar', label: 'Estadísticas Ventas' },
    { to: '/cierre-caja', icon: 'mdi-cash-lock', label: 'Cierre de Caja' },
    { to: '/gastos', icon: 'mdi-cash-minus', label: 'Gastos' },
  ];

  const configItems = [
    { to: '/configuracion', icon: 'mdi-cog', label: 'Ajustes Generales' },
    { to: '/impresoras', icon: 'mdi-printer', label: 'Impresoras' },
    { to: '/verifactu', icon: 'mdi-shield-check', label: 'VeriFactu' },
    { to: '/carta-digital', icon: 'mdi-qrcode', label: 'Carta Digital' },
    { to: '/mesas', icon: 'mdi-table-furniture', label: 'Gestión Mesas' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="mdi mdi-silverware-fork-knife sidebar-logo-icon"></span>
        <div className="sidebar-logo-text">
          <h2>FAHMA</h2>
          <p>Sistema POS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Main section */}
        {!collapsed && <div className="sidebar-section-title">Principal</div>}

        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className={`mdi ${item.icon}`}></span>
            <span className="label">{item.label}</span>
          </NavLink>
        ))}

        {/* Carta section (expandable) */}
        {!collapsed && <div className="sidebar-section-title">Carta</div>}

        <div
          className={`sidebar-item ${cartaOpen ? 'active' : ''}`}
          onClick={() => setCartaOpen(!cartaOpen)}
          title={collapsed ? 'Carta' : undefined}
        >
          <span className="mdi mdi-book-open-page-variant"></span>
          <span className="label">Carta</span>
          {!collapsed && (
            <span className={`mdi sidebar-chevron ${cartaOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'}`}></span>
          )}
        </div>

        {cartaOpen && (
          <div className="sidebar-submenu">
            {cartaItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`mdi ${item.icon}`}></span>
                <span className="label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Stock section (expandable) */}
        {!collapsed && <div className="sidebar-section-title">Stock</div>}

        <div
          className={`sidebar-item ${stockOpen ? 'active' : ''}`}
          onClick={() => setStockOpen(!stockOpen)}
          title={collapsed ? 'Stock' : undefined}
        >
          <span className="mdi mdi-package-variant"></span>
          <span className="label">Stock</span>
          {!collapsed && (
            <span className={`mdi sidebar-chevron ${stockOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'}`}></span>
          )}
        </div>

        {stockOpen && (
          <div className="sidebar-submenu">
            {stockItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`mdi ${item.icon}`}></span>
                <span className="label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Equipo section (expandable) */}
        {!collapsed && <div className="sidebar-section-title">Equipo</div>}

        <div
          className={`sidebar-item ${equipoOpen ? 'active' : ''}`}
          onClick={() => setEquipoOpen(!equipoOpen)}
          title={collapsed ? 'Equipo' : undefined}
        >
          <span className="mdi mdi-account-tie"></span>
          <span className="label">Equipo</span>
          {!collapsed && (
            <span className={`mdi sidebar-chevron ${equipoOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'}`}></span>
          )}
        </div>

        {equipoOpen && (
          <div className="sidebar-submenu">
            {equipoItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`mdi ${item.icon}`}></span>
                <span className="label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Fidelización section (expandable) */}
        {!collapsed && <div className="sidebar-section-title">Fidelización</div>}

        <div
          className={`sidebar-item ${fidelOpen ? 'active' : ''}`}
          onClick={() => setFidelOpen(!fidelOpen)}
          title={collapsed ? 'Fidelización' : undefined}
        >
          <span className="mdi mdi-account-multiple"></span>
          <span className="label">Fidelización</span>
          {!collapsed && (
            <span className={`mdi sidebar-chevron ${fidelOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'}`}></span>
          )}
        </div>

        {fidelOpen && (
          <div className="sidebar-submenu">
            {fidelItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`mdi ${item.icon}`}></span>
                <span className="label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Informes section (expandable) */}
        {!collapsed && <div className="sidebar-section-title">Informes</div>}

        <div
          className={`sidebar-item ${informesOpen ? 'active' : ''}`}
          onClick={() => setInformesOpen(!informesOpen)}
          title={collapsed ? 'Informes' : undefined}
        >
          <span className="mdi mdi-chart-bar"></span>
          <span className="label">Informes</span>
          {!collapsed && (
            <span className={`mdi sidebar-chevron ${informesOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'}`}></span>
          )}
        </div>

        {informesOpen && (
          <div className="sidebar-submenu">
            {informesItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`mdi ${item.icon}`}></span>
                <span className="label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Configuración section (expandable) */}
        {!collapsed && <div className="sidebar-section-title">Configuración</div>}

        <div
          className={`sidebar-item ${configOpen ? 'active' : ''}`}
          onClick={() => setConfigOpen(!configOpen)}
          title={collapsed ? 'Configuración' : undefined}
        >
          <span className="mdi mdi-cog"></span>
          <span className="label">Configuración</span>
          {!collapsed && (
            <span className={`mdi sidebar-chevron ${configOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'}`}></span>
          )}
        </div>

        {configOpen && (
          <div className="sidebar-submenu">
            {configItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`mdi ${item.icon}`}></span>
                <span className="label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="sidebar-logout">
        <button onClick={() => setClockInOpen(true)} style={{ marginBottom: '8px' }}>
          <span className="mdi mdi-clock-check-outline"></span>
          <span>Fichar</span>
        </button>
        <button onClick={handleLogout}>
          <span className="mdi mdi-logout"></span>
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Collapse toggle */}
      <div className="sidebar-toggle" onClick={onToggle}>
        <span className={`mdi ${collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'}`}></span>
      </div>

      <ClockInModal isOpen={clockInOpen} onClose={() => setClockInOpen(false)} />
    </aside>
  );
}
