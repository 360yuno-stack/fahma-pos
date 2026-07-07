import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Users.css';

const roles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'camarero', label: 'Camarero' },
  { value: 'cocina', label: 'Cocina' },
];

const roleColors = {
  admin: 'badge-danger',
  cajero: 'badge-warning',
  camarero: 'badge-info',
  cocina: 'badge-success',
};

const emptyForm = { username: '', email: '', firstName: '', lastName: '', role: 'camarero', password: '' };

export default function Users() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setUsers(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ ...emptyForm });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'camarero',
      password: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...formData };
      if (editingUser && !data.password) delete data.password;
      if (editingUser) {
        await usersAPI.update(editingUser._id || editingUser.id, data);
        addToast('Usuario actualizado correctamente', 'success');
      } else {
        await usersAPI.create(data);
        addToast('Usuario creado correctamente', 'success');
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al guardar usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.delete(deletingUser._id || deletingUser.id);
      addToast('Usuario eliminado correctamente', 'success');
      setShowDeleteConfirm(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar usuario', 'error');
    }
  };

  const getRoleLabel = (role) => roles.find(r => r.value === role)?.label || role;

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><div className="loading-text">Cargando...</div></div>;
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="mdi mdi-plus" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-account-group-outline" />
          <h3 className="empty-state-title">Sin usuarios</h3>
          <p className="empty-state-description">Agrega el primer usuario del sistema</p>
        </div>
      ) : (
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Nombre Completo</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id || user.id}>
                    <td>
                      <div className="user-name-cell">
                        <div className="user-avatar">{(user.firstName?.[0] || user.username?.[0] || '?').toUpperCase()}</div>
                        <span>{user.username}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.firstName} {user.lastName}</td>
                    <td><span className={`badge ${roleColors[user.role] || 'badge-gray'}`}>{getRoleLabel(user.role)}</span></td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-icon btn-ghost" onClick={() => openEditModal(user)}><span className="mdi mdi-pencil" /></button>
                        <button className="btn btn-icon btn-ghost" onClick={() => { setDeletingUser(user); setShowDeleteConfirm(true); }}><span className="mdi mdi-delete" /></button>
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
              <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input className="form-input" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellido</label>
                    <input className="form-input" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Usuario</label>
                  <input className="form-input" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Rol</label>
                    <select className="form-select" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                      {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña</label>
                    <input className="form-input" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder={editingUser ? 'Dejar vacío para no cambiar' : ''} required={!editingUser} />
                  </div>
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
              <h2>Eliminar Usuario</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={() => setShowDeleteConfirm(false)} />
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar al usuario <strong>{deletingUser?.username}</strong>? Esta acción no se puede deshacer.</p>
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
