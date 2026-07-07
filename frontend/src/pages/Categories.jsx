import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Categories.css';

const Categories = () => {
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'mdi-tag',
    color: '#1976D2',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoriesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setCategories(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar categorías', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: 'mdi-tag',
      color: '#1976D2',
    });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      icon: category.icon || 'mdi-tag',
      color: category.color || '#1976D2',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
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
      if (editingCategory) {
        await categoriesAPI.update(editingCategory._id, formData);
        addToast('Categoría actualizada correctamente', 'success');
      } else {
        await categoriesAPI.create(formData);
        addToast('Categoría creada correctamente', 'success');
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al guardar categoría', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (category) => {
    setDeletingCategory(category);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingCategory(null);
  };

  const handleDelete = async () => {
    try {
      await categoriesAPI.delete(deletingCategory._id);
      addToast('Categoría eliminada correctamente', 'success');
      closeDeleteConfirm();
      fetchCategories();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar categoría', 'error');
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
    <div className="categories-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">{categories.length} categorías registradas</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="mdi mdi-plus" /> Nueva Categoría
        </button>
      </div>

      {/* Empty State */}
      {categories.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-shape-outline" />
          <h3 className="empty-state-title">Sin categorías</h3>
          <p className="empty-state-description">Crea tu primera categoría para organizar tus productos.</p>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((category) => (
            <div className="category-card" key={category._id}>
              <div
                className="category-icon-wrapper"
                style={{
                  backgroundColor: (category.color || '#1976D2') + '22',
                  color: category.color || '#1976D2',
                }}
              >
                <span className={`mdi ${category.icon || 'mdi-tag'}`} />
              </div>
              <h3>{category.name}</h3>
              <p>{category.description || 'Sin descripción'}</p>
              <div className="category-card-actions">
                <button
                  className="btn-icon btn-ghost"
                  onClick={() => openEditModal(category)}
                  title="Editar"
                >
                  <span className="mdi mdi-pencil" />
                </button>
                <button
                  className="btn-icon btn-ghost"
                  onClick={() => openDeleteConfirm(category)}
                  title="Eliminar"
                >
                  <span className="mdi mdi-delete" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-input"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Nombre de la categoría"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-input"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Descripción de la categoría"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Icono (clase MDI)</label>
                  <input
                    type="text"
                    className="form-input"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="mdi-tag"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div className="color-input-row">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="color-preview"
                    />
                    <input
                      type="text"
                      className="form-input"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      placeholder="#1976D2"
                    />
                  </div>
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

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar Categoría</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeDeleteConfirm} />
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <span className="mdi mdi-alert-circle-outline delete-warning-icon" />
                <p>
                  ¿Estás seguro de que deseas eliminar la categoría{' '}
                  <strong>{deletingCategory?.name}</strong>? Esta acción no se puede deshacer.
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

export default Categories;
