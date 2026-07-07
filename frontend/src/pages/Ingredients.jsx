import React, { useState, useEffect } from 'react';
import { ingredientsAPI, providersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Products.css';

const Ingredients = () => {
  const { addToast } = useToast();
  const [ingredients, setIngredients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    stock: '',
    minStock: '',
    costPerUnit: '',
    provider: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingIngredient, setDeletingIngredient] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIngredients();
    fetchProviders();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await ingredientsAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setIngredients(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar ingredientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await providersAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProviders(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar proveedores', 'error');
    }
  };

  const getProviderName = (providerId) => {
    const prov = providers.find((p) => p._id === providerId);
    return prov ? prov.name : '—';
  };

  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch = !search || ing.name?.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = !providerFilter || ing.provider === providerFilter;
    return matchesSearch && matchesProvider;
  });

  const openCreateModal = () => {
    setEditingIngredient(null);
    setFormData({
      name: '',
      unit: 'kg',
      stock: '',
      minStock: '',
      costPerUnit: '',
      provider: '',
    });
    setShowModal(true);
  };

  const openEditModal = (ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name || '',
      unit: ingredient.unit || 'kg',
      stock: ingredient.stock !== undefined ? ingredient.stock : '',
      minStock: ingredient.minStock !== undefined ? ingredient.minStock : '',
      costPerUnit: ingredient.costPerUnit !== undefined ? ingredient.costPerUnit : '',
      provider: ingredient.provider || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIngredient(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        stock: parseFloat(formData.stock) || 0,
        minStock: parseFloat(formData.minStock) || 0,
        costPerUnit: parseFloat(formData.costPerUnit) || 0,
      };
      if (editingIngredient) {
        await ingredientsAPI.update(editingIngredient._id, payload);
        addToast('Ingrediente actualizado', 'success');
      } else {
        await ingredientsAPI.create(payload);
        addToast('Ingrediente creado', 'success');
      }
      closeModal();
      fetchIngredients();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (ingredient) => {
    setDeletingIngredient(ingredient);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingIngredient(null);
  };

  const handleDelete = async () => {
    try {
      await ingredientsAPI.delete(deletingIngredient._id);
      addToast('Ingrediente eliminado', 'success');
      closeDeleteConfirm();
      fetchIngredients();
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
          <h1 className="page-title">Ingredientes</h1>
          <p className="page-subtitle">{filteredIngredients.length} ingredientes encontrados</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="mdi mdi-plus" /> Nuevo Ingrediente
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="mdi mdi-magnify search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
        >
          <option value="">Todos los proveedores</option>
          {providers.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {filteredIngredients.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-shaker" />
          <h3 className="empty-state-title">Sin ingredientes</h3>
          <p className="empty-state-description">No se encontraron ingredientes con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Stock</th>
                <th>Min. Stock</th>
                <th>Costo Unit.</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map((ing) => {
                const stockLow = ing.stock <= ing.minStock;
                return (
                  <tr key={ing._id}>
                    <td>
                      <strong>{ing.name}</strong>
                    </td>
                    <td>
                      <span style={{ color: stockLow ? 'var(--color-danger)' : 'inherit', fontWeight: stockLow ? '600' : 'normal' }}>
                        {ing.stock} {ing.unit}
                      </span>
                    </td>
                    <td>{ing.minStock} {ing.unit}</td>
                    <td>€{(ing.costPerUnit || 0).toFixed(2)}</td>
                    <td>{getProviderName(ing.provider)}</td>
                    <td>
                      {stockLow ? (
                        <span className="badge badge-danger">Stock Bajo</span>
                      ) : (
                        <span className="badge badge-success">OK</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-icon btn-ghost"
                        onClick={() => openEditModal(ing)}
                        title="Editar"
                      >
                        <span className="mdi mdi-pencil" />
                      </button>
                      <button
                        className="btn-icon btn-ghost"
                        onClick={() => openDeleteConfirm(ing)}
                        title="Eliminar"
                      >
                        <span className="mdi mdi-delete" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}</h2>
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
                    placeholder="Ej. Harina, Tomate"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unidad de medida</label>
                    <select
                      className="form-select"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                    >
                      <option value="kg">Kilogramos (kg)</option>
                      <option value="g">Gramos (g)</option>
                      <option value="l">Litros (l)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="u">Unidades (u)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo por unidad</label>
                    <input
                      type="number"
                      className="form-input"
                      name="costPerUnit"
                      value={formData.costPerUnit}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Stock actual</label>
                    <input
                      type="number"
                      className="form-input"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      step="0.01"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock mínimo (Alerta)</label>
                    <input
                      type="number"
                      className="form-input"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleChange}
                      step="0.01"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Proveedor</label>
                  <select
                    className="form-select"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                  >
                    <option value="">Sin proveedor</option>
                    {providers.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
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
              <h2>Eliminar Ingrediente</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeDeleteConfirm} />
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <span className="mdi mdi-alert-circle-outline delete-warning-icon" />
                <p>
                  ¿Estás seguro de que deseas eliminar el ingrediente{' '}
                  <strong>{deletingIngredient?.name}</strong>?
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

export default Ingredients;
