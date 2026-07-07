import React, { useState } from 'react';

export default function DigitalMenuSettings() {
  const [settings, setSettings] = useState({
    themeColor: '#ff6b00',
    showPrices: true,
    showImages: true,
    allowOrders: false,
    welcomeMessage: '¡Bienvenido a nuestra Carta Digital!',
    logoUrl: ''
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // Simulate API save
    setTimeout(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Configuración de Carta Digital</h1>
          <p className="page-subtitle">Ajustes del menú QR</p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.open('http://localhost:3000/menu-preview', '_blank')}>
          <span className="mdi mdi-eye" /> Ver Carta
        </button>
      </div>

      {saved && (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
          Configuración guardada correctamente
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Diseño y Apariencia</h3>
          
          <div className="form-group">
            <label className="form-label">Color Principal</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="color" 
                value={settings.themeColor}
                onChange={e => setSettings({ ...settings, themeColor: e.target.value })}
                style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px' }}
              />
              <span className="text-sm text-gray-600">{settings.themeColor}</span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label className="form-label">URL del Logo</label>
            <input
              type="text"
              className="form-input"
              value={settings.logoUrl}
              onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label className="form-label">Mensaje de Bienvenida</label>
            <input
              type="text"
              className="form-input"
              value={settings.welcomeMessage}
              onChange={e => setSettings({ ...settings, welcomeMessage: e.target.value })}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Opciones de Visualización</h3>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <label className="form-label" style={{ marginBottom: '0' }}>Mostrar Precios</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showPrices}
                onChange={e => setSettings({ ...settings, showPrices: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <label className="form-label" style={{ marginBottom: '0' }}>Mostrar Imágenes de Productos</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showImages}
                onChange={e => setSettings({ ...settings, showImages: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <label className="form-label" style={{ marginBottom: '0' }}>Permitir Pedidos desde la Carta (QR)</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.allowOrders}
                onChange={e => setSettings({ ...settings, allowOrders: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          
          <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
