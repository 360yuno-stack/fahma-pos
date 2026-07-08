import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Printers() {
  const [printers, setPrinters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', ipAddress: '', port: 9100, type: 'facturacion', paperWidth: 80, isActive: true, categories: [],
    connectionType: 'tcp', mainTpv: '', secondaryTpv: '', allowToMarch: true, zones: []
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPrinters();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/printers');
      setPrinters(res.data.data);
    } catch (err) {
      setError('Error al cargar impresoras');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/printers/${editingId}`, formData);
      } else {
        await api.post('/printers', formData);
      }
      setIsModalOpen(false);
      fetchPrinters();
    } catch (err) {
      setError('Error al guardar la impresora');
    }
  };

  const handleTestPrinter = async () => {
    if (!editingId) {
      alert('Por favor, selecciona una impresora guardada o guárdala antes de probarla.');
      return;
    }
    try {
      const res = await api.post(`/printers/${editingId}/test`);
      alert(res.data.message || 'Prueba de impresión enviada con éxito');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al conectar con la impresora');
    }
  };

  const openEdit = (printer) => {
    setFormData({ 
      name: printer.name, 
      ipAddress: printer.ipAddress || '', 
      port: printer.port || 9100,
      type: printer.type,
      paperWidth: printer.paperWidth,
      isActive: printer.isActive,
      categories: printer.categories || [],
      connectionType: printer.connectionType || 'tcp',
      mainTpv: printer.mainTpv || '',
      secondaryTpv: printer.secondaryTpv || '',
      allowToMarch: printer.allowToMarch !== undefined ? printer.allowToMarch : true,
      zones: printer.zones || []
    });
    setEditingId(printer._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta impresora?')) {
      try {
        await api.delete(`/printers/${id}`);
        fetchPrinters();
      } catch (err) {
        setError('Error al eliminar');
      }
    }
  };

  return (
    <div className="products-page">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Impresoras</h1>
            <p className="page-subtitle">Gestiona las impresoras térmicas de barra y cocina</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setFormData({ 
                name: '', ipAddress: '', port: 9100, type: 'facturacion', paperWidth: 80, isActive: true, categories: [],
                connectionType: 'tcp', mainTpv: '', secondaryTpv: '', allowToMarch: true, zones: []
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
          >
            <span className="mdi mdi-plus" /> Nueva Impresora
          </button>
        </div>

        {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

        <div className="card">
          {loading ? (
            <div className="loading-container" style={{ padding: '40px 0' }}>
              <div className="spinner" />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>IP / Puerto</th>
                  <th>Tipo</th>
                  <th>Papel</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {printers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                      No hay impresoras configuradas
                    </td>
                  </tr>
                ) : (
                  printers.map(printer => (
                    <tr key={printer._id}>
                      <td style={{ fontWeight: '500' }}>{printer.name}</td>
                      <td>{printer.ipAddress}:{printer.port}</td>
                      <td style={{ textTransform: 'capitalize' }}>{printer.type}</td>
                      <td>{printer.paperWidth}mm</td>
                      <td>
                        {printer.isActive ? (
                          <span className="badge badge-success">Activa</span>
                        ) : (
                          <span className="badge badge-danger">Inactiva</span>
                        )}
                      </td>
                      <td>
                        <button className="btn-icon btn-ghost" onClick={() => openEdit(printer)}>
                          <span className="mdi mdi-pencil" />
                        </button>
                        <button className="btn-icon btn-ghost" onClick={() => handleDelete(printer._id)}>
                          <span className="mdi mdi-delete" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Editar Impresora' : 'Nueva Impresora'}</h2>
                <button className="modal-close-btn mdi mdi-close" onClick={() => setIsModalOpen(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej. Barra 1, Cocina Fuego"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo de Impresora</label>
                      <select 
                        className="form-select"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="facturacion">Facturación / Ticket</option>
                        <option value="barra">Barra (Bebidas)</option>
                        <option value="cocina">Cocina (Comida)</option>
                        <option value="kds">KDS (Pantalla)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row" style={{ marginTop: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">Dirección IP</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.ipAddress}
                        onChange={e => setFormData({ ...formData, ipAddress: e.target.value })}
                        placeholder="192.168.1.100"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Puerto</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.port}
                        onChange={e => setFormData({ ...formData, port: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">Tamaño de Papel</label>
                      <select 
                        className="form-select"
                        value={formData.paperWidth}
                        onChange={e => setFormData({ ...formData, paperWidth: Number(e.target.value) })}
                      >
                        <option value={80}>80 mm</option>
                        <option value={58}>58 mm</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingTop: '25px' }}>
                      <label className="form-label" style={{ marginBottom: '0' }}>Activa</label>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  {/* Nueva fila: Tipo de Conexión y Marchar Platos */}
                  <div className="form-row" style={{ marginTop: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">Tipo de Conexión</label>
                      <select 
                        className="form-select"
                        value={formData.connectionType}
                        onChange={e => setFormData({ ...formData, connectionType: e.target.value })}
                      >
                        <option value="tcp">Red / TCP/IP (Ethernet/Wifi)</option>
                        <option value="system">Sistema / USB Local</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingTop: '25px' }}>
                      <label className="form-label" style={{ marginBottom: '0' }}>Permitir Marchar Platos</label>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={formData.allowToMarch}
                          onChange={e => setFormData({ ...formData, allowToMarch: e.target.checked })}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  {/* Nueva fila: TPV Principal y TPV Secundario */}
                  <div className="form-row" style={{ marginTop: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">TPV Principal</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.mainTpv}
                        onChange={e => setFormData({ ...formData, mainTpv: e.target.value })}
                        placeholder="Ej. TPV 1, Caja"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">TPV Secundario</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.secondaryTpv}
                        onChange={e => setFormData({ ...formData, secondaryTpv: e.target.value })}
                        placeholder="Ej. Tablet Terraza"
                      />
                    </div>
                  </div>

                  {/* Nueva fila: Zonas Habilitadas */}
                  <div className="form-row" style={{ marginTop: '15px' }}>
                    <div className="form-group" style={{ width: '100%' }}>
                      <label className="form-label">Zonas Habilitadas para Impresión</label>
                      <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                        {['Zona 1', 'terraza', 'Barra'].map(zoneName => (
                          <label key={zoneName} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'capitalize' }}>
                            <input
                              type="checkbox"
                              checked={formData.zones.includes(zoneName)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, zones: [...formData.zones, zoneName] });
                                } else {
                                  setFormData({ ...formData, zones: formData.zones.filter(z => z !== zoneName) });
                                }
                              }}
                            />
                            {zoneName}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {formData.type === 'cocina' || formData.type === 'barra' ? (
                    <div className="form-row" style={{ marginTop: '15px' }}>
                      <div className="form-group" style={{ width: '100%' }}>
                        <label className="form-label">Categorías (Impresión de Comandas)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '5px' }}>
                          {categories.map(cat => (
                            <label key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={formData.categories.includes(cat._id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, categories: [...formData.categories, cat._id] });
                                  } else {
                                    setFormData({ ...formData, categories: formData.categories.filter(id => id !== cat._id) });
                                  }
                                }}
                              />
                              {cat.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="modal-footer">
                  <div style={{ flexGrow: 1 }}>
                    <button type="button" className="btn btn-secondary" onClick={handleTestPrinter}>
                      Probar Impresora
                    </button>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar Impresora</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
