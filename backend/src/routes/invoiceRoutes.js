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

// POST /api/invoices - Subir factura
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
    }

    const { quarter, year, notes } = req.body;
    if (!quarter || !year) {
      return res.status(400).json({ success: false, message: 'Año y trimestre son obligatorios' });
    }

    const invoice = new Invoice({
      filename: req.file.originalname,
      filepath: `/uploads/invoices/${req.file.filename}`,
      quarter: parseInt(quarter),
      year: parseInt(year),
      notes: notes || '',
      uploadedBy: req.user ? req.user.id : null
    });

    const saved = await invoice.save();
    res.status(201).json({
      success: true,
      data: saved
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/invoices/:id - Eliminar factura
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.id || req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    // Intentar eliminar el archivo físico
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
