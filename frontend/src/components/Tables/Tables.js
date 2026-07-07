import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Tables.css';

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTable, setNewTable] = useState({
    number: '',
    name: '',
    zone: 'Zona 1',
    capacity: 4
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const response = await api.get('/tables');
      setTables(response.data.data);
    } catch (error) {
      toast.error('Error al cargar mesas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tables', newTable);
      toast.success('Mesa creada exitosamente');
      setShowModal(false);
      setNewTable({ number: '', name: '', zone: 'Zona 1', capacity: 4 });
      loadTables();
    } catch (error) {
      toast.error('Error al crear mesa');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'libre': return 'green';
      case 'ocupada': return 'red';
      case 'pendiente_pago': return 'orange';
      default: return 'gray';
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="tables-container">
      <div className="tables-header">
        <div>
          <h1> Gestión de Mesas</h1>
          <p>{tables.length} mesas configuradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nueva Mesa
        </button>
      </div>

      <div className="tables-grid">
        {tables.map((table) => (
          <div key={table._id} className={`table-card ${getStatusColor(table.status)}`}>
            <div className="table-number">{table.number}</div>
            <h3>{table.name}</h3>
            <div className="table-info">
              <span> {table.zone}</span>
              <span> {table.capacity} personas</span>
            </div>
            <div className={`table-status ${table.status}`}>
              {table.status === 'libre' && ' Libre'}
              {table.status === 'ocupada' && ' Ocupada'}
              {table.status === 'pendiente_pago' && ' Pendiente'}
            </div>
            {table.customerName && (
              <div className="table-customer">
                 {table.customerName}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Mesa</h2>
            <form onSubmit={handleCreateTable}>
              <div className="input-group">
                <label>Número</label>
                <input
                  type="number"
                  value={newTable.number}
                  onChange={(e) => setNewTable({...newTable, number: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label>Nombre</label>
                <input
                  type="text"
                  placeholder="Mesa 1"
                  value={newTable.name}
                  onChange={(e) => setNewTable({...newTable, name: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label>Zona</label>
                <select
                  value={newTable.zone}
                  onChange={(e) => setNewTable({...newTable, zone: e.target.value})}
                >
                  <option>Zona 1</option>
                  <option>2</option>
                  <option>Terraza</option>
                  <option>BAR 1</option>
                  <option>BAR 2</option>
                  <option>BAR 3</option>
                  <option>BAR 4</option>
                </select>
              </div>
              <div className="input-group">
                <label>Capacidad</label>
                <input
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({...newTable, capacity: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;
