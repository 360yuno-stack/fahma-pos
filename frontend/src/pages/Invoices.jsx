import { useState, useEffect } from 'react';
import { invoicesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Invoices.css';

export default function Invoices() {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor((new Date().getMonth() + 3) / 3));
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);

  // Generar años desde 2024 hasta 2030
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const quarters = [
    { value: 1, label: '1º Trimestre (Ene - Mar)' },
    { value: 2, label: '2º Trimestre (Abr - Jun)' },
    { value: 3, label: '3º Trimestre (Jul - Sep)' },
    { value: 4, label: '4º Trimestre (Oct - Dic)' }
  ];

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoicesAPI.getAll({ year: selectedYear, quarter: selectedQuarter });
      setInvoices(res.data?.data || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cargar las facturas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedYear, selectedQuarter]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      addToast('Por favor, selecciona un archivo', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('quarter', selectedQuarter);
    formData.append('year', selectedYear);
    formData.append('notes', notes);

    setUploading(true);
    try {
      await invoicesAPI.upload(formData);
      addToast('Factura subida correctamente', 'success');
      setFile(null);
      setNotes('');
      fetchInvoices();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al subir la factura', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta factura?')) return;
    try {
      await invoicesAPI.delete(id);
      addToast('Factura eliminada correctamente', 'success');
      fetchInvoices();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar la factura', 'error');
    }
  };

  const getBackendUrl = (filepath) => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      const root = envUrl.replace(/\/api\/?$/, '');
      return `${root}${filepath}`;
    }
    return `http://${window.location.hostname}:5000${filepath}`;
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'mdi-file-pdf-box text-danger';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'mdi-file-excel-box text-success';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return 'mdi-file-image-outline text-warning';
    return 'mdi-file-document-outline text-primary';
  };

  return (
    <div className="invoices-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asesoría Contable</h1>
          <p className="page-subtitle">Sube y gestiona las facturas y documentación para tu gestor por trimestre.</p>
        </div>
      </div>

      <div className="invoices-grid">
        {/* Panel Izquierdo: Filtro y Carga */}
        <div className="invoices-card upload-section">
          <h2>Subir Nueva Factura</h2>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Año Fiscal</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Trimestre</label>
              <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))}>
                {quarters.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </div>

            <div className="form-group file-input-group">
              <label className="file-drop-zone">
                <span className="mdi mdi-cloud-upload-outline upload-icon"></span>
                <span className="upload-text">
                  {file ? file.name : 'Arrastra o haz clic para seleccionar factura (PDF, Imagen, Excel)'}
                </span>
                <input type="file" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv" />
              </label>
            </div>

            <div className="form-group">
              <label>Notas / Descripción (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ej: Factura Proveedor Bebidas, Alquiler local..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={uploading}>
              {uploading ? (
                <>
                  <span className="spinner-border" /> Subiendo factura...
                </>
              ) : (
                'Subir a la Nube'
              )}
            </button>
          </form>
        </div>

        {/* Panel Derecho: Lista de Documentos */}
        <div className="invoices-card list-section">
          <div className="list-header">
            <h2>Documentos del {selectedQuarter}º Trimestre {selectedYear}</h2>
            <button className="btn btn-secondary btn-sm" onClick={fetchInvoices}>
              <span className="mdi mdi-refresh"></span> Actualizar
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <p>Cargando facturas...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              <span className="mdi mdi-file-outline empty-icon"></span>
              <p>No hay facturas subidas en este trimestre.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Notas</th>
                    <th>Fecha de Subida</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice._id}>
                      <td className="invoice-file-cell">
                        <span className={`mdi ${getFileIcon(invoice.filename)} file-type-icon`}></span>
                        <div className="file-info">
                          <span className="file-name" title={invoice.filename}>{invoice.filename}</span>
                        </div>
                      </td>
                      <td>
                        <span className="invoice-notes">{invoice.notes || '—'}</span>
                      </td>
                      <td className="invoice-date-cell">
                        {new Date(invoice.createdAt).toLocaleDateString()} {new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="text-right">
                        <div className="action-buttons">
                          <a 
                            href={getBackendUrl(invoice.filepath)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-icon btn-outline-success" 
                            title="Descargar Factura"
                          >
                            <span className="mdi mdi-download"></span>
                          </a>
                          <button 
                            onClick={() => handleDelete(invoice._id)} 
                            className="btn btn-icon btn-outline-danger" 
                            title="Eliminar Factura"
                          >
                            <span className="mdi mdi-delete-outline"></span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
