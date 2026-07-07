import { useState, useEffect } from 'react';
import { expensesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Expenses.css';

const emptyForm = { description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'General' };

export default function Expenses() {
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expensesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setExpenses(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar gastos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormData({ ...emptyForm });
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description || '',
      amount: expense.amount || '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      category: expense.category || 'General',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...formData, amount: Number(formData.amount) };
      if (editingExpense) {
        await expensesAPI.update(editingExpense._id || editingExpense.id, data);
        addToast('Gasto actualizado correctamente', 'success');
      } else {
        await expensesAPI.create(data);
        addToast('Gasto creado correctamente', 'success');
      }
      closeModal();
      fetchExpenses();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al guardar gasto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await expensesAPI.delete(deletingExpense._id || deletingExpense.id);
      addToast('Gasto eliminado correctamente', 'success');
      setShowDeleteConfirm(false);
      setDeletingExpense(null);
      fetchExpenses();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar gasto', 'error');
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><div className="loading-text">Cargando...</div></div>;
  }

  return (
    <div className="expenses-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gastos</h1>
          <p className="page-subtitle">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''} registrado{expenses.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span className="mdi mdi-plus" /> Nuevo Gasto
          </button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-cash-minus" />
          <h3 className="empty-state-title">Sin gastos</h3>
          <p className="empty-state-description">Registra el primer gasto del sistema</p>
        </div>
      ) : (
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense._id || expense.id}>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>{expense.description}</td>
                    <td><span className="badge badge-info">{expense.category}</span></td>
                    <td className="expense-amount">${Number(expense.amount).toFixed(2)}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-icon btn-ghost" onClick={() => openEditModal(expense)}><span className="mdi mdi-pencil" /></button>
                        <button className="btn btn-icon btn-ghost" onClick={() => { setDeletingExpense(expense); setShowDeleteConfirm(true); }}><span className="mdi mdi-delete" /></button>
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
              <h2>{editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monto</label>
                    <input className="form-input" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input className="form-input" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="General">General</option>
                    <option value="Insumos">Insumos</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Otros">Otros</option>
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
              <h2>Eliminar Gasto</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={() => setShowDeleteConfirm(false)} />
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar el gasto <strong>{deletingExpense?.description}</strong>? Esta acción no se puede deshacer.</p>
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
