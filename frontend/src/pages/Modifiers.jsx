import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Modifiers() {
  const [modifiers, setModifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', isRequired: false, multiple: false });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchModifiers();
  }, []);

  const fetchModifiers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/modifiers');
      setModifiers(res.data.data);
    } catch (err) {
      setError('Error al cargar modificadores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/modifiers/${editingId}`, formData);
      } else {
        await api.post('/modifiers', formData);
      }
      setIsModalOpen(false);
      fetchModifiers();
    } catch (err) {
      setError('Error al guardar el modificador');
    }
  };

  const openEdit = (mod) => {
    setFormData({ name: mod.name, isRequired: mod.isRequired, multiple: mod.multiple });
    setEditingId(mod._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este grupo de modificadores?')) {
      try {
        await api.delete(`/modifiers/${id}`);
        fetchModifiers();
      } catch (err) {
        setError('Error al eliminar');
      }
    }
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Modificadores</h1>
          <p className="page-subtitle">Gestiona las opciones extra de los productos</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setFormData({ name: '', isRequired: false, multiple: false });
            setEditingId(null);
            setIsModalOpen(true);
          }}
        >
          <span className="mdi mdi-plus" /> Nuevo Grupo
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
                <th>Requerido</th>
                <th>Múltiple</th>
                <th>Opciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modifiers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                    No hay modificadores registrados
                  </td>
                </tr>
              ) : (
                modifiers.map(mod => (
                  <tr key={mod._id}>
                    <td style={{ fontWeight: '500' }}>{mod.name}</td>
                    <td>{mod.isRequired ? 'Sí' : 'No'}</td>
                    <td>{mod.multiple ? 'Sí' : 'No'}</td>
                    <td>{mod.options?.length || 0}</td>
                    <td>
                      <button className="btn-icon btn-ghost" onClick={() => openEdit(mod)}>
                        <span className="mdi mdi-pencil" />
                      </button>
                      <button className="btn-icon btn-ghost" onClick={() => handleDelete(mod._id)}>
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
              <h2>{editingId ? 'Editar Grupo' : 'Nuevo Grupo de Modificadores'}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={() => setIsModalOpen(false)} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Grupo (ej. Punto de la carne, Salsas)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-row" style={{ marginTop: '15px' }}>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label className="form-label" style={{ marginBottom: '0' }}>¿Es obligatorio?</label>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formData.isRequired}
                        onChange={e => setFormData({ ...formData, isRequired: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label className="form-label" style={{ marginBottom: '0' }}>¿Selección Múltiple?</label>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={formData.multiple}
                        onChange={e => setFormData({ ...formData, multiple: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
