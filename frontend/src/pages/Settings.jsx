import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Settings.css';

function Settings() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    restaurantName: 'FAHMA',
    address: '',
    phone: '',
    email: '',
    taxRate: 10,
    currency: 'EUR',
    nif: '',
    ticketFooterText: ''
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      const data = res.data?.data || res.data || {};
      setForm({
        restaurantName: data.restaurantName || 'FAHMA',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        taxRate: data.taxRate ?? 10,
        currency: data.currency || 'EUR',
        nif: data.nif || '',
        ticketFooterText: data.ticketFooterText || ''
      });
    } catch (err) {
      addToast('Error al cargar configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.update(form);
      addToast('Configuración guardada correctamente', 'success');
    } catch (err) {
      addToast('Error al guardar configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><div className="loading-text">Cargando...</div></div>;
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Ajustes generales del restaurante e impresión de tickets</p>
        </div>
      </div>

      <form className="card settings-form" onSubmit={handleSave}>
        <div className="card-header">
          <h2 className="card-title"><span className="mdi mdi-cog" style={{marginRight: 8}} />Configuración del Restaurante</h2>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nombre del Restaurante</label>
            <input className="form-input" value={form.restaurantName} onChange={e => setForm({...form, restaurantName: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">CIF / NIF</label>
            <input className="form-input" value={form.nif} onChange={e => setForm({...form, nif: e.target.value})} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Moneda</label>
            <select className="form-select" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tasa IVA (%)</label>
            <input className="form-input" type="number" min="0" max="100" value={form.taxRate} onChange={e => setForm({...form, taxRate: parseFloat(e.target.value) || 0})} />
          </div>
          <div className="form-group">
            <label className="form-label">Texto de Pie de Ticket (Agradecimiento)</label>
            <input className="form-input" value={form.ticketFooterText} onChange={e => setForm({...form, ticketFooterText: e.target.value})} placeholder="Ej: ¡¡¡MUCHAS GRACIAS POR SU VISITA!!!" />
          </div>
        </div>

        <div style={{marginTop: 24, display: 'flex', justifyContent: 'flex-end'}}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <span className="mdi mdi-content-save" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
