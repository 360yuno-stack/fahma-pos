import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', icon: '', color: '#6B7280', order: 0 });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/categories`, { headers: { 'x-auth-token': token }});
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editing) {
        await axios.put(`${API_URL}/categories/${editing._id}`, form, { headers: { 'x-auth-token': token }});
      } else {
        await axios.post(`${API_URL}/categories`, form, { headers: { 'x-auth-token': token }});
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', icon: '', color: '#6B7280', order: 0 });
      fetchCategories();
    } catch (err) {
      alert('Error: ' + err.response?.data?.message);
    }
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon, color: cat.color, order: cat.order });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar categoría?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/categories/${id}`, { headers: { 'x-auth-token': token }});
      fetchCategories();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const emojis = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="categories-page">
      <div className="header">
        <h1>Categorías</h1>
        <button className="btn-new" onClick={() => setShowModal(true)}>+ Nuevo</button>
      </div>

      <input 
        type="text" 
        placeholder="Buscar..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Imagen</th>
            <th>Subcategorías</th>
            <th>Orden</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(cat => (
            <tr key={cat._id}>
              <td>{cat.name}</td>
              <td>
                <div className="icon-circle" style={{ backgroundColor: cat.color }}>
                  {cat.icon}
                </div>
              </td>
              <td>
                <span className={`badge ${cat.hasSubcategories ? 'yes' : 'no'}`}>
                  {cat.hasSubcategories ? '
# ============================================
# FAHMA POS - PARTE 2: FRONTEND REACT
# ============================================

Write-Host "`n" -ForegroundColor Cyan
Write-Host "  FAHMA POS - INSTALACIÓN PARTE 2/3    " -ForegroundColor Cyan
Write-Host "  Frontend: Componentes React          " -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor Cyan

New-Item -Path "frontend\src\pages" -ItemType Directory -Force | Out-Null
New-Item -Path "frontend\src\components" -ItemType Directory -Force | Out-Null

# ============================================
# Categories.jsx - Componente Principal
# ============================================
@'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Categories.css';

const API_URL = 'http://localhost:5000/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', icon: '', color: '#6B7280', order: 0 });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/categories`, { headers: { 'x-auth-token': token }});
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editing) {
        await axios.put(`${API_URL}/categories/${editing._id}`, form, { headers: { 'x-auth-token': token }});
      } else {
        await axios.post(`${API_URL}/categories`, form, { headers: { 'x-auth-token': token }});
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Error desconocido'));
    }
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon, color: cat.color, order: cat.order });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/categories/${id}`, { headers: { 'x-auth-token': token }});
      fetchCategories();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', icon: '', color: '#6B7280', order: 0 });
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const emojis = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];

  if (loading) return <div className="loading-spinner">Cargando...</div>;

  return (
    <div className="categories-page">
      <div className="header-section">
        <h1>Categorías</h1>
        <button className="btn-nuevo" onClick={() => setShowModal(true)}>+ Nuevo</button>
      </div>

      <div className="search-section">
        <input 
          type="text" 
          placeholder="Buscar..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Imagen</th>
              <th>Tiene Subcategorías</th>
              <th>Orden</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cat => (
              <tr key={cat._id}>
                <td>{cat.name}</td>
                <td>
                  <div className="icon-display" style={{ backgroundColor: cat.color }}>
                    {cat.icon}
                  </div>
                </td>
                <td>
                  <span className={`badge ${cat.hasSubcategories ? 'badge-si' : 'badge-no'}`}>
                    {cat.hasSubcategories ? 'Sí' : 'No'}
                  </span>
                </td>
                <td>{cat.order}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(cat)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDelete(cat._id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Icono</label>
                <div className="emoji-grid">
                  {emojis.map(emoji => (
                    <button 
                      key={emoji}
                      type="button"
                      className={`emoji-btn ${form.icon === emoji ? 'selected' : ''}`}
                      onClick={() => setForm({...form, icon: emoji})}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Color</label>
                <input 
                  type="color" 
                  value={form.color}
                  onChange={(e) => setForm({...form, color: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Orden</label>
                <input 
                  type="number" 
                  value={form.order}
                  onChange={(e) => setForm({...form, order: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-save">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
