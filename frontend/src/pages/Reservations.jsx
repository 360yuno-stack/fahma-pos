import { useState, useEffect } from 'react';
import { reservationsAPI, tablesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Reservations.css';

const statusConfig = {
  pending: { label: 'Pendiente', badge: 'badge-warning' },
  confirmed: { label: 'Confirmada', badge: 'badge-success' },
  cancelled: { label: 'Cancelada', badge: 'badge-danger' },
  completed: { label: 'Completada', badge: 'badge-gray' },
};

const emptyForm = { customerName: '', customerPhone: '', date: '', time: '', guests: 2, table: '', notes: '' };

export default function Reservations() {
  const { addToast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingReservation, setDeletingReservation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await reservationsAPI.getAll({ date: dateFilter || undefined });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setReservations(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar reservas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await tablesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setTables(list);
    } catch (err) {
      // silent fail for tables
    }
  };

  useEffect(() => { fetchTables(); }, []);
  useEffect(() => { fetchReservations(); }, [dateFilter]);

  const openCreateModal = () => {
    setEditingReservation(null);
    setFormData({ ...emptyForm });
    setShowModal(true);
  };

  const openEditModal = (reservation) => {
    setEditingReservation(reservation);
    setFormData({
      customerName: reservation.customerName || '',
      customerPhone: reservation.customerPhone || '',
      date: reservation.date ? reservation.date.slice(0, 10) : '',
      time: reservation.time || '',
      guests: reservation.guests || 2,
      table: reservation.table?._id || reservation.table || '',
      notes: reservation.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReservation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingReservation) {
        await reservationsAPI.update(editingReservation._id || editingReservation.id, formData);
        addToast('Reserva actualizada correctamente', 'success');
      } else {
        await reservationsAPI.create(formData);
        addToast('Reserva creada correctamente', 'success');
      }
      closeModal();
      fetchReservations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al guardar reserva', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await reservationsAPI.delete(deletingReservation._id || deletingReservation.id);
      addToast('Reserva eliminada correctamente', 'success');
      setShowDeleteConfirm(false);
      setDeletingReservation(null);
      fetchReservations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar reserva', 'error');
    }
  };

  const getTableName = (tableId) => {
    if (!tableId) return 'Sin asignar';
    const t = tables.find(tb => (tb._id || tb.id) === (tableId?._id || tableId));
    return t ? (t.name || `Mesa ${t.number}`) : 'Sin asignar';
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><div className="loading-text">Cargando...</div></div>;
  }

  return (
    <div className="reservations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reservas</h1>
          <p className="page-subtitle">{reservations.length} reserva{reservations.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="mdi mdi-plus" /> Nueva Reserva
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Filtrar por fecha</label>
          <input type="date" className="form-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
        {dateFilter && (
          <button className="btn btn-ghost btn-sm" onClick={() => setDateFilter('')}>
            <span className="mdi mdi-close" /> Limpiar filtro
          </button>
        )}
      </div>

      {reservations.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-calendar-blank-outline" />
          <h3 className="empty-state-title">Sin reservas</h3>
          <p className="empty-state-description">No hay reservas registradas</p>
        </div>
      ) : (
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Personas</th>
                  <th>Mesa</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(r => (
                  <tr key={r._id || r.id}>
                    <td><span className="reservation-customer">{r.customerName}</span></td>
                    <td><span className="reservation-phone">{r.customerPhone}</span></td>
                    <td>{r.date ? new Date(r.date).toLocaleDateString('es-ES') : '-'}</td>
                    <td>{r.time || '-'}</td>
                    <td>
                      <span className="reservation-guests">
                        <span className="mdi mdi-account" /> {r.guests}
                      </span>
                    </td>
                    <td>{getTableName(r.table)}</td>
                    <td>
                      <span className={`badge ${statusConfig[r.status]?.badge || 'badge-gray'}`}>
                        {statusConfig[r.status]?.label || r.status || 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-icon btn-ghost" onClick={() => openEditModal(r)}><span className="mdi mdi-pencil" /></button>
                        <button className="btn btn-icon btn-ghost" onClick={() => { setDeletingReservation(r); setShowDeleteConfirm(true); }}><span className="mdi mdi-delete" /></button>
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
              <h2>{editingReservation ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre del cliente</label>
                    <input className="form-input" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-input" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora</label>
                    <input type="time" className="form-input" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Personas</label>
                    <input type="number" min="1" className="form-input" value={formData.guests} onChange={e => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mesa</label>
                    <select className="form-select" value={formData.table} onChange={e => setFormData({ ...formData, table: e.target.value })}>
                      <option value="">Sin asignar</option>
                      {tables.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name || `Mesa ${t.number}`}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea className="form-textarea" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Notas adicionales..." />
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
              <h2>Eliminar Reserva</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={() => setShowDeleteConfirm(false)} />
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar la reserva de <strong>{deletingReservation?.customerName}</strong>? Esta acción no se puede deshacer.</p>
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
