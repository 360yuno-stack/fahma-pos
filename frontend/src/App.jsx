import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TableRequests from './pages/TableRequests';
import TPV from './pages/TPV';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Tables from './pages/Tables';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Reservations from './pages/Reservations';
import Reports from './pages/Reports';
import CashClosure from './pages/CashClosure';
import Settings from './pages/Settings';
import KDS from './pages/KDS';
import Clients from './pages/Clients';
import Expenses from './pages/Expenses';
import Shifts from './pages/Shifts';
import Ingredients from './pages/Ingredients';
import Providers from './pages/Providers';
import Recipes from './pages/Recipes';
import Modifiers from './pages/Modifiers';
import DigitalMenuSettings from './pages/DigitalMenuSettings';
import MenuPreview from './pages/MenuPreview';
import Printers from './pages/Printers';
import VerifactuConfig from './pages/VerifactuConfig';
import Attendance from './pages/Attendance';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ height: '100vh' }}>
        <div className="spinner" />
        <div className="loading-text">Cargando FAHMA...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/solicitudes-mesa" element={<TableRequests />} />
        <Route path="/tpv" element={<TPV />} />
        <Route path="/productos" element={<Products />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/ingredientes" element={<Ingredients />} />
        <Route path="/proveedores" element={<Providers />} />
        <Route path="/recetas" element={<Recipes />} />
        <Route path="/mesas" element={<Tables />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/usuarios" element={<Users />} />
        <Route path="/cierre-caja" element={<CashClosure />} />
        <Route path="/reportes" element={<Reports />} />
        <Route path="/configuracion" element={<Settings />} />
        <Route path="/carta-digital" element={<DigitalMenuSettings />} />
        <Route path="/modificadores" element={<Modifiers />} />
        <Route path="/cocina" element={<KDS />} />
        <Route path="/reservas" element={<Reservations />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/gastos" element={<Expenses />} />
        <Route path="/turnos" element={<Shifts />} />
        <Route path="/asistencia" element={<Attendance />} />
        <Route path="/impresoras" element={<Printers />} />
        <Route path="/verifactu" element={<VerifactuConfig />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="/menu-preview" element={<MenuPreview />} />
    </Routes>
  );
}

export default App;
