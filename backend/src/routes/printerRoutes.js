const express = require('express');
const router = express.Router();
const Printer = require('../models/Printer');

// GET /api/printers
router.get('/', async (req, res) => {
  try {
    const printers = await Printer.find().sort({ name: 1 });
    res.json({ success: true, count: printers.length, data: printers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/printers
router.post('/', async (req, res) => {
  try {
    const printer = await Printer.create(req.body);
    res.status(201).json({ success: true, data: printer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/printers/:id
router.put('/:id', async (req, res) => {
  try {
    const printer = await Printer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!printer) return res.status(404).json({ success: false, message: 'Printer not found' });
    res.json({ success: true, data: printer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/printers/:id
router.delete('/:id', async (req, res) => {
  try {
    const printer = await Printer.findByIdAndDelete(req.params.id);
    if (!printer) return res.status(404).json({ success: false, message: 'Printer not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const fs = require('fs');

// POST /api/printers/:id/test
router.post('/:id/test', async (req, res) => {
  try {
    const printer = await Printer.findById(req.params.id);
    if (!printer) return res.status(404).json({ success: false, message: 'Printer not found' });

    const ESC = '\x1b';
    const GS = '\x1d';
    
    let data = '';
    data += ESC + '@'; // Initialize
    data += ESC + 'a' + '\x01'; // Center
    data += ESC + 'E' + '\x01'; // Bold ON
    data += 'EL FOGON DEL AGUILA\n';
    data += ESC + 'E' + '\x00'; // Bold OFF
    data += 'FAHMA POS\n';
    data += '-------------------------------\n\n';
    data += ESC + 'a' + '\x00'; // Left
    data += `Impresora: ${printer.name}\n`;
    data += `Tipo: ${printer.type}\n`;
    
    if (printer.connectionType === 'system') {
      data += `Conexion: USB Local Shared (\\\\localhost\\${printer.name})\n`;
    } else {
      data += `Conexion: TCP/IP (${printer.ipAddress}:${printer.port || 9100})\n`;
    }
    
    data += `Fecha: ${new Date().toLocaleString()}\n\n`;
    data += ESC + 'a' + '\x01'; // Center
    data += 'CONEXION EXITOSA!\n';
    data += '-------------------------------\n';
    data += '\n\n\n\n';
    data += GS + 'V' + '\x41' + '\x03'; // Cut

    if (printer.connectionType === 'system') {
      const sharePath = `\\\\localhost\\${printer.name}`;
      console.log(`Prueba USB: Escribiendo en ${sharePath}...`);
      try {
        fs.writeFileSync(sharePath, data, 'latin1');
        res.json({ success: true, message: `Prueba enviada con éxito por USB a ${printer.name} (${sharePath})` });
      } catch (err) {
        console.error(`Error en prueba de impresión USB en ${printer.name}:`, err.message);
        res.status(500).json({ 
          success: false, 
          message: `Error al imprimir por USB en la impresora de Windows compartida como '${printer.name}' (${sharePath}). Asegúrate de compartirla en las propiedades de Windows. Detalle: ${err.message}` 
        });
      }
    } else {
      const ipAddress = printer.ipAddress;
      const port = printer.port || 9100;
      console.log(`Enviando ticket de prueba de red a ${printer.name} (${ipAddress}:${port})...`);

      const client = new net.Socket();
      client.setTimeout(3000);

      client.connect(port, ipAddress, () => {
        client.write(data, 'latin1', () => {
          client.end();
          res.json({ success: true, message: `Prueba enviada con éxito a ${printer.name} (${ipAddress}:${port})` });
        });
      });

      client.on('error', (err) => {
        console.error(`Error de impresión en ${printer.name}:`, err.message);
        res.status(500).json({ 
          success: false, 
          message: `Error al conectar a ${printer.name} (${ipAddress}:${port}): ${err.message}` 
        });
      });

      client.on('timeout', () => {
        client.destroy();
        res.status(504).json({ 
          success: false, 
          message: `Tiempo de espera agotado al conectar a ${printer.name} (${ipAddress}:${port}).` 
        });
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
