import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Attendance.css';

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMessage, setPinMessage] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance');
      setAttendance(res.data.data);
    } catch (err) {
      setError('Error al cargar fichajes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleNumpadClick = (num) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setPinMessage('');
    }
  };

  const handleClear = () => {
    setPin('');
    setPinMessage('');
  };

  const handleSubmitPin = async () => {
    if (pin.length !== 4) {
      setPinMessage('El PIN debe tener 4 dígitos');
      return;
    }
    setPinLoading(true);
    setPinMessage('');
    try {
      const response = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      if (response.ok) {
        setPinMessage('Fichaje registrado con éxito');
        fetchAttendance(); // Refresh table
        setTimeout(() => {
          handleClear();
        }, 2000);
      } else {
        setPinMessage(data.message || 'Error al fichar');
      }
    } catch (err) {
      setPinMessage('Error de conexión');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="products-page">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Fichajes</h1>
            <p className="page-subtitle">Control de asistencia del equipo</p>
          </div>
        </div>

        {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

        <div className="attendance-grid">
          {/* Fichaje Integrado (Numpad) */}
          <div className="card clock-in-card">
            <h3>Fichar Ahora</h3>
            <div className="clock-in-body">
              <div className="pin-display">
                {pin.padEnd(4, '•').split('').map((char, index) => (
                  <span key={index} className={char !== '•' ? 'filled' : ''}>{char}</span>
                ))}
              </div>
              {pinMessage && <div className="message" style={{textAlign: 'center', marginBottom: '10px', color: pinMessage.includes('éxito') ? 'green' : 'red'}}>{pinMessage}</div>}
              <div className="numpad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button key={num} onClick={() => handleNumpadClick(num.toString())}>
                    {num}
                  </button>
                ))}
                <button className="clear-btn" onClick={handleClear}>C</button>
                <button onClick={() => handleNumpadClick('0')}>0</button>
                <button className="submit-btn" onClick={handleSubmitPin} disabled={pinLoading || pin.length !== 4}>
                  <span className="mdi mdi-check"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Registros */}
          <div className="card">
            {loading ? (
              <div className="loading-container" style={{ padding: '40px 0' }}>
                <div className="spinner" />
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                        No hay registros de asistencia
                      </td>
                    </tr>
                  ) : (
                    attendance.map(record => (
                      <tr key={record._id}>
                        <td style={{ fontWeight: '500' }}>{record.employeeId?.name || record.employeeId?.firstName || 'Desconocido'}</td>
                        <td>{formatDate(record.clockInTime)}</td>
                        <td>{formatDate(record.clockOutTime)}</td>
                        <td>
                          {record.status === 'active' ? (
                            <span className="badge badge-success">Trabajando</span>
                          ) : (
                            <span className="badge badge-secondary">Completado</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
  );
}
