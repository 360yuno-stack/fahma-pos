const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Invoice = require('../models/Invoice');

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/invoices');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Permitir PDFs, imágenes y excels/docs
    const filetypes = /jpeg|jpg|png|pdf|xlsx|xls|csv|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Formato de archivo no soportado. Sube PDF, Excel o Imágenes.'));
  }
});

// GET /api/invoices - Listar facturas filtradas por año y trimestre
router.get('/', async (req, res) => {
  try {
    const { year, quarter } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year);
    if (quarter) filter.quarter = parseInt(quarter);

    const invoices = await Invoice.find(filter)
      .populate('uploadedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invoices
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/invoices - Subir una o varias facturas
router.post('/', upload.any(), async (req, res) => {
  try {
    const uploadedFiles = req.files || [];
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
    }

    const { quarter, year, notes } = req.body;
    if (!quarter || !year) {
      return res.status(400).json({ success: false, message: 'Año y trimestre son obligatorios' });
    }

    const savedInvoices = [];
    for (const fileItem of uploadedFiles) {
      let base64Data = '';
      try {
        if (fs.existsSync(fileItem.path)) {
          const buffer = fs.readFileSync(fileItem.path);
          base64Data = buffer.toString('base64');
        }
      } catch (e) {
        console.error('Error reading uploaded file buffer:', e);
      }

      const invoice = new Invoice({
        filename: fileItem.originalname,
        filepath: `/uploads/invoices/${fileItem.filename}`,
        mimeType: fileItem.mimetype || 'application/octet-stream',
        fileData: base64Data,
        quarter: parseInt(quarter),
        year: parseInt(year),
        notes: notes || '',
        uploadedBy: req.user ? req.user.id : null
      });
      const saved = await invoice.save();
      savedInvoices.push(saved);
    }

    res.status(201).json({
      success: true,
      count: savedInvoices.length,
      data: savedInvoices,
      message: `Se han subido y procesado ${savedInvoices.length} facturas correctamente`
    });
  } catch (err) {
    console.error('Error POST /api/invoices:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/invoices/:id/file - Ver/Descargar archivo de factura (Servicio robusto)
router.get('/:id/file', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).send('Factura no encontrada');
    }

    const isDownload = req.query.download === 'true';
    const disposition = isDownload ? 'attachment' : 'inline';

    // 1. Probar ubicaciones físicas en disco
    const possiblePaths = [
      path.join(__dirname, '../..', invoice.filepath),
      path.join(process.cwd(), invoice.filepath),
      path.join(process.cwd(), 'backend', invoice.filepath),
      path.join(__dirname, '../../uploads/invoices', path.basename(invoice.filepath))
    ];

    const diskPath = possiblePaths.find(p => fs.existsSync(p));
    if (diskPath) {
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(invoice.filename)}"`);
      return res.sendFile(path.resolve(diskPath));
    }

    // 2. Si el disco fue reiniciado por Render, servir desde MongoDB Base64
    if (invoice.fileData) {
      const fileBuffer = Buffer.from(invoice.fileData, 'base64');
      const ext = path.extname(invoice.filename).toLowerCase();
      let contentType = invoice.mimeType || 'application/octet-stream';

      if (ext === '.pdf') contentType = 'application/pdf';
      else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (['.xls', '.xlsx'].includes(ext)) contentType = 'application/vnd.ms-excel';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(invoice.filename)}"`);
      return res.send(fileBuffer);
    }

    // Fallback amigable si el archivo antiguo fue efímero antes de esta actualización
    res.status(404).send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #334155;">
          <div style="text-align: center; max-width: 500px; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h2 style="color: #e11d48; margin-top: 0;">Factura de sesión anterior</h2>
            <p>Este archivo fue subido en una sesión antigua en el almacenamiento temporal de Render.</p>
            <p><strong>A partir de ahora, todas las facturas subidas se guardan permanentemente en la nube.</strong> Por favor vuelve a subir esta factura.</p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error GET /api/invoices/:id/file:', err);
    res.status(500).send('Error interno del servidor al procesar archivo');
  }
});

// DELETE /api/invoices/:id - Eliminar factura
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.id || req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    // Intentar eliminar el archivo físico si existe
    const absolutePath = path.join(__dirname, '../..', invoice.filepath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.error('Error deleting physical file:', err.message);
      }
    }

    await Invoice.findByIdAndDelete(invoice._id);
    res.json({ success: true, message: 'Factura eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
