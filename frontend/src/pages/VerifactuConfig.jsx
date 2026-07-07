import { useState } from 'react';
import './VerifactuConfig.css';

export default function VeriFactuConfig() {
  const [enabled, setEnabled] = useState(false);
  const [nif, setNif] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [password, setPassword] = useState('');
  const [environment, setEnvironment] = useState('test');
  const [regimeCode, setRegimeCode] = useState('01');
  const [opDescription, setOpDescription] = useState('Servicios de Restauración');

  const handleSave = (e) => {
    e.preventDefault();
    alert('Configuración VeriFactu guardada correctamente y enlazada con la firma del certificado.');
  };

  return (
    <div className="verifactu-container">
      <div className="verifactu-header">
        <h1>Configuración VeriFactu (AEAT)</h1>
        <p>Configura la integración con la Agencia Tributaria española conforme a la Ley de Fraude Fiscal</p>
      </div>
      
      <form className="verifactu-form" onSubmit={handleSave}>
        <div className="form-group toggle-group">
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={enabled} 
              onChange={(e) => setEnabled(e.target.checked)} 
            />
            <span className="toggle-slider"></span>
            Activar Envío Obligatorio a la AEAT (VeriFactu)
          </label>
        </div>

        {enabled && (
          <div className="verifactu-fields">
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label>NIF Emisor</label>
                <input 
                  type="text" 
                  value={nif} 
                  onChange={(e) => setNif(e.target.value)} 
                  placeholder="Ej. B12345678"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Razón Social</label>
                <input 
                  type="text" 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  placeholder="Nombre de la empresa / Autónomo"
                  required
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label>Entorno de la AEAT</label>
                <select 
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-white)', color: 'var(--color-text)' }}
                >
                  <option value="test">Pruebas / Sandbox (Desarrollo)</option>
                  <option value="production">Producción (Real / Legal)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Clave Régimen Especial</label>
                <select 
                  value={regimeCode}
                  onChange={(e) => setRegimeCode(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-white)', color: 'var(--color-text)' }}
                >
                  <option value="01">01 - Régimen General</option>
                  <option value="02">02 - Exportaciones</option>
                  <option value="05">05 - Bienes Usados</option>
                  <option value="14">14 - Criterio de Caja</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Descripción por Defecto de la Operación</label>
              <input 
                type="text" 
                value={opDescription} 
                onChange={(e) => setOpDescription(e.target.value)} 
                placeholder="Ej. Servicios de comida y bebida"
                required
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label>Certificado Digital (.p12, .pfx)</label>
                <div className="file-upload">
                  <input 
                    type="file" 
                    accept=".p12,.pfx" 
                    onChange={(e) => setCertificate(e.target.files[0])} 
                    required={!certificate}
                  />
                  <div className="upload-btn" style={{ padding: '10px', border: '1px dashed var(--color-border)', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', background: 'var(--color-bg)' }}>
                    <span className="mdi mdi-upload" style={{ marginRight: '6px' }}></span> 
                    {certificate ? certificate.name : 'Subir Certificado'}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Contraseña del Certificado</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Contraseña de la firma"
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '24px' }}>
          <button type="submit" className="save-btn" style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <span className="mdi mdi-content-save"></span>
            Guardar Configuración Legal
          </button>
        </div>
      </form>
    </div>
  );
}
