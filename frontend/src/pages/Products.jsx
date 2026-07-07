import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Products.css';

const Products = () => {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    category: '',
    sku: '',
    isAvailable: true,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProducts(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setCategories(list);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar categorías', 'error');
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c._id === categoryId);
    return cat ? cat.name : '—';
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      category: '',
      sku: '',
      isAvailable: true,
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      cost: product.cost || '',
      category: product.category || '',
      sku: product.sku || '',
      isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
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
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
      };
      if (editingProduct) {
        await productsAPI.update(editingProduct._id, payload);
        addToast('Producto actualizado correctamente', 'success');
      } else {
        await productsAPI.create(payload);
        addToast('Producto creado correctamente', 'success');
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al guardar producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (product) => {
    setDeletingProduct(product);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingProduct(null);
  };

  const handleDelete = async () => {
    try {
      await productsAPI.delete(deletingProduct._id);
      addToast('Producto eliminado correctamente', 'success');
      closeDeleteConfirm();
      fetchProducts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar producto', 'error');
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
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">{filteredProducts.length} productos encontrados</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="mdi mdi-plus" /> Nuevo Producto
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="mdi mdi-magnify search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon mdi mdi-package-variant" />
          <h3 className="empty-state-title">Sin productos</h3>
          <p className="empty-state-description">No se encontraron productos con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Costo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="product-name-cell">
                      <div className="product-info">
                        <span>{product.name}</span>
                        {product.description && (
                          <span className="product-desc">{product.description}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{product.sku || '—'}</td>
                  <td>{getCategoryName(product.category)}</td>
                  <td>€{(product.price || 0).toFixed(2)}</td>
                  <td>€{(product.cost || 0).toFixed(2)}</td>
                  <td>
                    {product.isAvailable ? (
                      <span className="badge badge-success">Disponible</span>
                    ) : (
                      <span className="badge badge-danger">No disponible</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-icon btn-ghost"
                      onClick={() => openEditModal(product)}
                      title="Editar"
                    >
                      <span className="mdi mdi-pencil" />
                    </button>
                    <button
                      className="btn-icon btn-ghost"
                      onClick={() => openDeleteConfirm(product)}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
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
                    placeholder="Nombre del producto"
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
                    placeholder="Descripción del producto"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Precio</label>
                    <input
                      type="number"
                      className="form-input"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo</label>
                    <input
                      type="number"
                      className="form-input"
                      name="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select
                      className="form-select"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input
                      type="text"
                      className="form-input"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="Código SKU"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Disponible</label>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleChange}
                    />
                    <span className="toggle-slider" />
                  </label>
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
              <h2>Eliminar Producto</h2>
              <button className="modal-close-btn mdi mdi-close" onClick={closeDeleteConfirm} />
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <span className="mdi mdi-alert-circle-outline delete-warning-icon" />
                <p>
                  ¿Estás seguro de que deseas eliminar el producto{' '}
                  <strong>{deletingProduct?.name}</strong>? Esta acción no se puede deshacer.
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

export default Products;
