import { useState, useEffect } from 'react';
import { tablesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Tables.css';

const zones = [
  { id: 'principal', label: 'Principal' },
  { id: 'terraza', label: 'Terraza' },
  { id: 'bar', label: 'Bar' },
  { id: 'privado', label: 'Privado' },
];

const statusConfig = {
  libre: { label: 'Libre', badge: 'badge-success' },
  ocupada: { label: 'Ocupada', badge: 'badge-warning' },
  reservada: { label: 'Reservada', badge: 'badge-info' },
  cerrada: { label: 'Cerrada', badge: 'badge-gray' },
};

const initialFormData = { name: '', number: '', zone: 'principal', capacity: 4 };

export default function Tables() {
  const { addToast } = useToast();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTable, setDeletingTable] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await tablesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setTables(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar las mesas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTable(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (table) => {
    setEditingTable(table);
    setFormData({
      name: table.name || '',
      number: table.number || '',
      zone: table.zone || 'principal',
      capacity: table.capacity || 4,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTable(null);
    setFormData(initialFormData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        number: Number(formData.number),
        capacity: Number(formData.capacity),
      };
      if (editingTable) {
        await tablesAPI.update(editingTable._id, payload);
        addToast('Mesa actualizada correctamente', 'success');
      } else {
        await tablesAPI.create(payload);
        addToast('Mesa creada correctamente', 'success');
      }
      handleCloseModal();
      fetchTables();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al guardar la mesa', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (table) => {
    setDeletingTable(table);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await tablesAPI.delete(deletingTable._id);
      addToast('Mesa eliminada correctamente', 'success');
      setShowDeleteConfirm(false);
      setDeletingTable(null);
      fetchTables();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar la mesa', 'error');
    }
  };

  const tablesByZone = zones.map((zone) => ({
    ...zone,
    tables: tables.filter((t) => t.zone === zone.id),
  })).filter((z) => z.tables.length > 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="tables-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Mesas</h1>
          <p className="page-subtitle">{tables.length} mesas registradas</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <span className="mdi mdi-plus" /> Nueva Mesa
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-table-furniture" />
          <h3 className="empty-state-title">Sin mesas</h3>
          <p className="empty-state-description">Crea tu primera mesa</p>
        </div>
      ) : (
        tablesByZone.map((zone) => (
          <div key={zone.id} className="tables-zone-section">
            <div className="zone-header">
              <h3>{zone.label}</h3>
              <span className="zone-count">{zone.tables.length}</span>
            </div>
            <div className="tables-grid">
              {zone.tables.map((table) => {
                const status = statusConfig[table.status] || statusConfig.libre;
                return (
                  <div key={table._id} className="table-card">
                    <div className="table-card-number">#{table.number}</div>
                    <div className="table-card-name">{table.name}</div>
                    <div className="table-card-info">
                      <div className="table-capacity">
                        <span className="mdi mdi-account-group" />
                        {table.capacity}
                      </div>
                      <span className={`badge ${status.badge}`}>{status.label}</span>
                    </div>
                    <div className="table-card-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => handleOpenEdit(table)}>
                        <span className="mdi mdi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(table)}>
                        <span className="mdi mdi-delete" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTable ? 'Editar Mesa' : 'Nueva Mesa'}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={handleCloseModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-input"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej: Mesa Ventana"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Número</label>
                  <input
                    className="form-input"
                    type="number"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="Ej: 1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Zona</label>
                  <select
                    className="form-select"
                    name="zone"
                    value={formData.zone}
                    onChange={handleChange}
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Capacidad</label>
                  <input
                    className="form-input"
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
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
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar Mesa</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={() => setShowDeleteConfirm(false)} />
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar la mesa <strong>#{deletingTable?.number}</strong>?</p>
              <p>Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
