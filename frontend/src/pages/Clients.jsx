import { useState, useEffect } from 'react';
import { clientsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Clients.css';

const emptyForm = { name: '', email: '', phone: '', address: '', dni_cif: '' };

export default function Clients() {
  const { addToast } = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingClient, setDeletingClient] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await clientsAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setClients(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({ ...emptyForm });
    setShowModal(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      dni_cif: client.dni_cif || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...formData };
      if (editingClient) {
        await clientsAPI.update(editingClient._id || editingClient.id, data);
        addToast('Cliente actualizado correctamente', 'success');
      } else {
        await clientsAPI.create(data);
        addToast('Cliente creado correctamente', 'success');
      }
      closeModal();
      fetchClients();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al guardar cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await clientsAPI.delete(deletingClient._id || deletingClient.id);
      addToast('Cliente eliminado correctamente', 'success');
      setShowDeleteConfirm(false);
      setDeletingClient(null);
      fetchClients();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar cliente', 'error');
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><div className="loading-text">Cargando...</div></div>;
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="mdi mdi-plus" /> Nuevo Cliente
          </button>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-account-group-outline" />
          <h3 className="empty-state-title">Sin clientes</h3>
          <p className="empty-state-description">Agrega el primer cliente del sistema</p>
        </div>
      ) : (
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>NIF / DNI</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client._id || client.id}>
                    <td>
                      <div className="client-name-cell">
                        <div className="client-avatar">{(client.name?.[0] || '?').toUpperCase()}</div>
                        <span>{client.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>{client.dni_cif || '-'}</td>
                    <td>{client.email || '-'}</td>
                    <td>{client.phone || '-'}</td>
                    <td>{client.address || '-'}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-icon btn-ghost" onClick={() => openEditModal(client)}><span className="mdi mdi-pencil" /></button>
                        <button className="btn btn-icon btn-ghost" onClick={() => { setDeletingClient(client); setShowDeleteConfirm(true); }}><span className="mdi mdi-delete" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre / Razón Social</label>
                  <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">NIF / DNI</label>
                  <input className="form-input" value={formData.dni_cif} onChange={e => setFormData({ ...formData, dni_cif: e.target.value })} placeholder="Ej. B82931186" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input className="form-input" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar Cliente</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={() => setShowDeleteConfirm(false)} />
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar el cliente <strong>{deletingClient?.name}</strong>? Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
