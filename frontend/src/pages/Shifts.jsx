import { useState, useEffect } from 'react';
import { shiftsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Shifts.css';

const emptyForm = { employee: '', startTime: new Date().toISOString().slice(0,16), endTime: '', status: 'Activo' };

export default function Shifts() {
  const { addToast } = useToast();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingShift, setDeletingShift] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await shiftsAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setShifts(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar turnos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShifts(); }, []);

  const openCreateModal = () => {
    setEditingShift(null);
    setFormData({ ...emptyForm, startTime: new Date().toISOString().slice(0,16) });
    setShowModal(true);
  };

  const openEditModal = (shift) => {
    setEditingShift(shift);
    setFormData({
      employee: shift.employee || '',
      startTime: shift.startTime ? new Date(shift.startTime).toISOString().slice(0,16) : '',
      endTime: shift.endTime ? new Date(shift.endTime).toISOString().slice(0,16) : '',
      status: shift.status || 'Activo',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShift(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...formData };
      if (editingShift) {
        await shiftsAPI.update(editingShift._id || editingShift.id, data);
        addToast('Turno actualizado correctamente', 'success');
      } else {
        await shiftsAPI.create(data);
        addToast('Turno iniciado correctamente', 'success');
      }
      closeModal();
      fetchShifts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al guardar turno', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await shiftsAPI.delete(deletingShift._id || deletingShift.id);
      addToast('Turno eliminado correctamente', 'success');
      setShowDeleteConfirm(false);
      setDeletingShift(null);
      fetchShifts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar turno', 'error');
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><div className="loading-text">Cargando...</div></div>;
  }

  return (
    <div className="shifts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Turnos de Equipo</h1>
          <p className="page-subtitle">{shifts.length} turno{shifts.length !== 1 ? 's' : ''} registrado{shifts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="mdi mdi-clock-start" /> Iniciar Turno
          </button>
        </div>
      </div>

      {shifts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-calendar-clock" />
          <h3 className="empty-state-title">Sin turnos</h3>
          <p className="empty-state-description">Inicia el primer turno del día</p>
        </div>
      ) : (
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(shift => (
                  <tr key={shift._id || shift.id}>
                    <td>
                      <div className="shift-employee-cell">
                        <div className="shift-avatar">{(shift.employee?.[0] || '?').toUpperCase()}</div>
                        <span>{shift.employee}</span>
                      </div>
                    </td>
                    <td>{new Date(shift.startTime).toLocaleString()}</td>
                    <td>{shift.endTime ? new Date(shift.endTime).toLocaleString() : '-'}</td>
                    <td>
                      <span className={`badge ${shift.status === 'Activo' ? 'badge-success' : 'badge-gray'}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-icon btn-ghost" onClick={() => openEditModal(shift)}><span className="mdi mdi-pencil" /></button>
                        <button className="btn btn-icon btn-ghost" onClick={() => { setDeletingShift(shift); setShowDeleteConfirm(true); }}><span className="mdi mdi-delete" /></button>
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
              <h2>{editingShift ? 'Editar Turno' : 'Iniciar Turno'}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Empleado</label>
                  <input className="form-input" value={formData.employee} onChange={e => setFormData({ ...formData, employee: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Inicio</label>
                    <input className="form-input" type="datetime-local" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fin</label>
                    <input className="form-input" type="datetime-local" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="Activo">Activo</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
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
              <h2>Eliminar Turno</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={() => setShowDeleteConfirm(false)} />
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar este turno de <strong>{deletingShift?.employee}</strong>? Esta acción no se puede deshacer.</p>
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
