import React, { useState, useEffect } from 'react';
import { providersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Products.css'; // Reusing common page styling

const Providers = () => {
  const { addToast } = useToast();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProvider, setDeletingProvider] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await providersAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProviders(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar proveedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter((prov) => {
    return !search || prov.name?.toLowerCase().includes(search.toLowerCase());
  });

  const openCreateModal = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
    });
    setShowModal(true);
  };

  const openEditModal = (provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name || '',
      contactName: provider.contactName || '',
      phone: provider.phone || '',
      email: provider.email || '',
      address: provider.address || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProvider(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingProvider) {
        await providersAPI.update(editingProvider._id, formData);
        addToast('Proveedor actualizado', 'success');
      } else {
        await providersAPI.create(formData);
        addToast('Proveedor creado', 'success');
      }
      closeModal();
      fetchProviders();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (provider) => {
    setDeletingProvider(provider);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingProvider(null);
  };

  const handleDelete = async () => {
    try {
      await providersAPI.delete(deletingProvider._id);
      addToast('Proveedor eliminado', 'success');
      closeDeleteConfirm();
      fetchProviders();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">{filteredProviders.length} proveedores registrados</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="mdi mdi-plus" /> Nuevo Proveedor
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="mdi mdi-magnify search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredProviders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-truck" />
          <h3 className="empty-state-title">Sin proveedores</h3>
          <p className="empty-state-description">No se encontraron proveedores con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.map((prov) => (
                <tr key={prov._id}>
                  <td>
                    <strong>{prov.name}</strong>
                  </td>
                  <td>{prov.contactName || '—'}</td>
                  <td>{prov.phone || '—'}</td>
                  <td>{prov.email || '—'}</td>
                  <td>{prov.address || '—'}</td>
                  <td>
                    <button
                      className="btn-icon btn-ghost"
                      onClick={() => openEditModal(prov)}
                      title="Editar"
                    >
                      <span className="mdi mdi-pencil" />
                    </button>
                    <button
                      className="btn-icon btn-ghost"
                      onClick={() => openDeleteConfirm(prov)}
                      title="Eliminar"
                    >
                      <span className="mdi mdi-delete" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre de la Empresa</label>
                  <input
                    type="text"
                    className="form-input"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ej. Distribuciones Food SL"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Persona de Contacto</label>
                  <input
                    type="text"
                    className="form-input"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      className="form-input"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+34 600 000 000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <textarea
                    className="form-input"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Dirección completa"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar Proveedor</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeDeleteConfirm} />
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <span className="mdi mdi-alert-circle-outline delete-warning-icon" />
                <p>
                  ¿Estás seguro de que deseas eliminar el proveedor{' '}
                  <strong>{deletingProvider?.name}</strong>?
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDeleteConfirm}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Providers;
