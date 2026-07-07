import { useState } from 'react';
import './ClockInModal.css';

export default function ClockInModal({ isOpen, onClose }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleNumpadClick = (num) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setMessage('');
    }
  };

  const handleClear = () => {
    setPin('');
    setMessage('');
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setMessage('El PIN debe tener 4 dígitos');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Fichaje registrado con éxito');
        setTimeout(() => {
          handleClear();
          onClose();
        }, 1500);
      } else {
        setMessage(data.message || 'Error al fichar');
      }
    } catch (err) {
      setMessage('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clock-in-overlay" onClick={onClose}>
      <div className="clock-in-modal" onClick={(e) => e.stopPropagation()}>
        <div className="clock-in-header">
          <h2>Fichaje (Control Horario)</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="clock-in-body">
          <div className="pin-display">
            {pin.padEnd(4, '•').split('').map((char, index) => (
              <span key={index} className={char !== '•' ? 'filled' : ''}>{char}</span>
            ))}
          </div>
          {message && <div className="message">{message}</div>}
          <div className="numpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} onClick={() => handleNumpadClick(num.toString())}>
                {num}
              </button>
            ))}
            <button className="clear-btn" onClick={handleClear}>C</button>
            <button onClick={() => handleNumpadClick('0')}>0</button>
            <button className="submit-btn" onClick={handleSubmit} disabled={loading || pin.length !== 4}>
              <span className="mdi mdi-check"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
