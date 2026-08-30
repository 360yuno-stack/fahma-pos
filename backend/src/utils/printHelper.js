const net = require('net');
const fs = require('fs');
const Printer = require('../models/Printer');
const Settings = require('../models/Settings');

async function printOrderComanda(order, passedPrinters = null) {
  if (process.env.IS_CLOUD_SERVER === 'true' || process.env.RENDER === 'true') {
    if (global.io) {
      console.log('Nube: Transmitiendo evento comanda a la caja...');
      try {
        const printers = await Printer.find({ isActive: true });
        global.io.to('printer-agent-room').emit('print:job', { type: 'comanda', order, printers });
      } catch (e) {
        global.io.to('printer-agent-room').emit('print:job', { type: 'comanda', order });
      }
    } else {
      console.warn('Nube: Socket.io no inicializado en servidor.');
    }
    return;
  }

  try {
    // 1. Obtener impresoras activas (usar pasadas por socket o buscar en BD)
    let printers = passedPrinters;
    if (!printers || printers.length === 0) {
      printers = await Printer.find({ isActive: true });
    }
    if (!printers || printers.length === 0) return;

    for (const printer of printers) {
      const { ipAddress, port, categories, connectionType, name } = printer;
      const printerCategoryIds = categories.map(c => c.toString());

      // 2. Filtrar los artículos que corresponden a las categorías de esta impresora
      const printerItems = [];
      for (const item of order.items) {
        let categoryId = null;

        if (item.product) {
          if (item.product.category) {
            categoryId = item.product.category._id 
              ? item.product.category._id.toString() 
              : item.product.category.toString();
          } else {
            const productId = item.product._id || item.product;
            if (productId) {
              try {
                const Product = require('../models/Product');
                const prod = await Product.findById(productId);
                if (prod && prod.category) {
                  categoryId = prod.category.toString();
                }
              } catch (e) {
                console.error('Error al buscar categoría del producto en DB para impresión:', e.message);
              }
            }
          }
        }

        if (categoryId && printerCategoryIds.includes(categoryId)) {
          printerItems.push(item);
        }
      }

      // 3. Si hay artículos, enviar comanda
      if (printerItems.length > 0) {
        const ESC = '\x1b';
        const GS = '\x1d';
        
        let data = '';
        data += ESC + '@'; // Inicializar
        
        // 1. Cabecera Comanda (Grande y Centrada)
        data += ESC + 'a' + '\x01'; // Centrar
        data += GS + '!' + '\x11'; // Doble alto, doble ancho (2x)
        data += ESC + 'E' + '\x01'; // Negrita ON
        data += `COMANDA: ${name.toUpperCase()}\n\n`;
        
        const mesaName = order.table ? (order.table.name || `MESA ${order.table.number}`) : 'PARA LLEVAR';
        data += `${mesaName.toUpperCase()}\n`;
        
        data += GS + '!' + '\x01'; // Doble alto, ancho normal
        data += `PEDIDO #: ${order.orderNumber}\n`;
        data += GS + '!' + '\x00'; // Normal
        data += ESC + 'E' + '\x00'; // Negrita OFF
        data += '------------------------------------------\n\n';
        
        // 2. Artículos (Izquierda)
        data += ESC + 'a' + '\x00'; // Izquierda
        for (const item of printerItems) {
          // Cantidad y Nombre en Grande y Negrita
          data += GS + '!' + '\x11'; // Doble alto, doble ancho (2x)
          data += ESC + 'E' + '\x01'; // Negrita ON
          data += `${item.quantity}x ${item.name.toUpperCase()}\n`;
          data += GS + '!' + '\x00'; // Normal
          data += ESC + 'E' + '\x00'; // Negrita OFF
          
          // Modificadores y Notas de producto en tamaño normal
          if (item.modifiers && item.modifiers.length > 0) {
            data += `   * MOD: ${item.modifiers.join(', ')}\n`;
          }
          if (item.notes) {
            data += `   * NOTA: ${item.notes}\n`;
          }
          data += '\n'; // Separación entre platos
        }
        
        // 3. Notas generales del pedido
        if (order.notes) {
          data += '------------------------------------------\n';
          data += GS + '!' + '\x01'; // Doble alto
          data += ESC + 'E' + '\x01'; // Negrita ON
          data += 'ANOTACIONES GENERALES:\n';
          data += GS + '!' + '\x11'; // Doble alto y doble ancho para la nota importante
          data += `${order.notes.toUpperCase()}\n`;
          data += GS + '!' + '\x00'; // Normal
          data += ESC + 'E' + '\x00'; // Negrita OFF
        }
        
        // 4. Pie de Comanda
        data += '------------------------------------------\n';
        data += `Hora: ${new Date().toLocaleTimeString()}\n`;
        data += `Camarero: ${order.server ? order.server.username : 'POS'}\n`;
        data += '\n\n\n\n';
        data += GS + 'V' + '\x41' + '\x03'; // Corte de papel

        if (connectionType === 'system') {
          // Impresión USB local directa en Windows vía Spooler API
          const path = require('path');
          const { exec } = require('child_process');
          const tempDir = process.env.TEMP || '/tmp';
          const tempBinPath = path.join(tempDir, `fahma_print_${Date.now()}.bin`);
          const psScriptPath = path.join(__dirname, 'print_raw.ps1');

          try {
            fs.writeFileSync(tempBinPath, data, 'latin1');
            const cmd = `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}" "${name}" "${tempBinPath}"`;
            
            exec(cmd, (err) => {
              try { fs.unlinkSync(tempBinPath); } catch (e) {}
              if (err) {
                console.error(`Error de impresión USB en ${name} vía Spooler:`, err.message);
              } else {
                console.log(`Comanda USB en ${name} enviada con éxito al Spooler.`);
              }
            });
          } catch (err) {
            console.error(`Error al escribir temporal para USB en ${name}:`, err.message);
          }
        } else {
          // Impresión de Red TCP/IP
          console.log(`Impresión automática Red: Enviando comanda a ${name} (${ipAddress}:${port})...`);
          const client = new net.Socket();
          client.setTimeout(3000);

          client.connect(port, ipAddress, () => {
            client.write(data, 'latin1', () => {
              client.end();
              console.log(`Comanda de red en ${name} enviada con éxito.`);
            });
          });

          client.on('error', (err) => {
            console.error(`Error de impresión de red en ${name} (${ipAddress}:${port}):`, err.message);
          });

          client.on('timeout', () => {
            client.destroy();
            console.error(`Tiempo de espera agotado en ${name} (${ipAddress}:${port})`);
          });
        }
      }
    }
  } catch (err) {
    console.error('Error en el proceso de impresión automática:', err);
  }
}

async function printOrderReceipt(order, passedPrinters = null) {
  if (process.env.IS_CLOUD_SERVER === 'true' || process.env.RENDER === 'true') {
    if (global.io) {
      console.log('Nube: Transmitiendo evento recibo a la caja...');
      try {
        let printers = await Printer.find({ isActive: true, type: 'facturacion' });
        if (printers.length === 0) {
          printers = await Printer.find({ isActive: true, type: 'barra' });
        }
        global.io.to('printer-agent-room').emit('print:job', { type: 'receipt', order, printers });
      } catch (e) {
        global.io.to('printer-agent-room').emit('print:job', { type: 'receipt', order });
      }
    } else {
      console.warn('Nube: Socket.io no inicializado en servidor.');
    }
    return;
  }

  try {
    // Obtener configuración del restaurante
    let settings = {};
    try {
      settings = await Settings.findOne() || {};
    } catch (e) {
      console.error('Error al cargar configuración para imprimir:', e.message);
    }

    // 1. Obtener impresoras de facturación activas (pasadas por socket o de BD)
    let printers = passedPrinters;
    if (!printers || printers.length === 0) {
      printers = await Printer.find({ isActive: true, type: 'facturacion' });
      if (printers.length === 0) {
        printers = await Printer.find({ isActive: true, type: 'barra' });
      }
    }
    
    if (!printers || printers.length === 0) {
      console.log('No se encontraron impresoras activas de facturación o barra para el ticket de venta.');
      return;
    }

    const formatTotalLine = (label, value) => {
      const valStr = `${value.toFixed(2)} EUR`;
      const spaces = 42 - label.length - valStr.length;
      return label + ''.padStart(spaces > 0 ? spaces : 1, ' ') + valStr + '\n';
    };

    for (const printer of printers) {
      const { ipAddress, port, connectionType, name } = printer;

      const ESC = '\x1b';
      const GS = '\x1d';
      
      let data = '';
      data += ESC + '@'; // Inicializar
      data += '\x1c\x70\x01\x00'; // Imprimir logo pre-almacenado en memoria NV (FS p 1 0)
      data += ESC + 'a' + '\x01'; // Centrar
      
      // Encabezado Premium con formato de texto limpio
      data += ESC + 'E' + '\x01'; // Negrita ON
      data += ESC + '!' + '\x38'; // Doble alto, doble ancho
      data += `${(settings.restaurantName || 'EL FOGÓN DEL ÁGUILA').toUpperCase()}\n`;
      data += ESC + '!' + '\x00'; // Normal
      data += ESC + 'E' + '\x00'; // Negrita OFF
      
      if (settings.address) data += `${settings.address}\n`;
      if (settings.nif) data += `NIF: ${settings.nif}\n`;
      if (settings.phone) data += `Tlf: ${settings.phone}\n`;
      data += '------------------------------------------\n'; // 42 guiones
      
      // Detalles del Ticket / Factura Simplificada
      data += ESC + 'a' + '\x00'; // Izquierda
      data += `Factura Simplificada: F-${new Date().getFullYear()}/${order.orderNumber}\n`;
      data += `Fecha: ${new Date(order.paidAt || order.createdAt).toLocaleString()}\n`;
      if (order.table) {
        const mesaName = order.table.name || `Mesa ${order.table.number}`;
        data += `Mesa: ${mesaName}\n`;
      }
      if (order.customer && order.customer.name) {
        data += `Cliente: ${order.customer.name}\n`;
        if (order.customer.phone) data += `Tlf: ${order.customer.phone}\n`;
      }
      data += '------------------------------------------\n';
      
      // Cabecera de artículos - 42 columnas: Cant(5) + Concepto(20) + P.U(8) + Importe(9)
      data += 'Cant  Concepto            P.U    Importe  \n';
      data += '------------------------------------------\n';
      
      // Artículos
      for (const item of order.items) {
        const qtyStr = `${item.quantity}x`.padEnd(5, ' ');
        const conceptStr = item.name.substring(0, 20).padEnd(20, ' ');
        const priceStr = item.price.toFixed(2).padStart(8, ' ');
        const subtotalStr = item.subtotal.toFixed(2).padStart(9, ' ');
        
        data += `${qtyStr}${conceptStr}${priceStr}${subtotalStr}\n`;
        if (item.modifiers && item.modifiers.length > 0) {
          data += `     * ${item.modifiers.join(', ')}\n`;
        }
      }
      
      data += '------------------------------------------\n';
      
      // Totales
      const subtotal = order.subtotal || (order.total / 1.10);
      const taxes = order.taxes || (order.total - subtotal);
      
      data += formatTotalLine('Base Imponible (10%):', subtotal);
      data += formatTotalLine('I.V.A.:', taxes);
      if (order.discount > 0) {
        data += formatTotalLine('Descuento:', -order.discount);
      }
      data += '------------------------------------------\n';
      
      // TOTAL EN GRANDE (42 cols)
      data += ESC + 'E' + '\x01'; // Negrita ON
      data += ESC + '!' + '\x10'; // Doble alto
      const totalLabel = 'TOTAL:';
      const totalValStr = `${order.total.toFixed(2)} EUR`;
      // TOTAL está en doble alto pero en cuanto a caracteres horizontales cuenta igual, calculamos espacios para alinear a la derecha
      const totalSpaces = 42 - totalLabel.length - totalValStr.length;
      data += totalLabel + ''.padStart(totalSpaces > 0 ? totalSpaces : 1, ' ') + totalValStr + '\n';
      data += ESC + '!' + '\x00'; // Normal
      data += ESC + 'E' + '\x00'; // Negrita OFF
      
      data += '------------------------------------------\n';
      
      let methodStr = 'EFECTIVO';
      if (order.paymentMethod === 'card' || order.paymentMethod === 'tarjeta') {
        methodStr = 'TARJETA';
      }
      data += `Metodo Pago: ${methodStr}\n`;
      
      if (order.verifactuHash) {
        data += '\nSISTEMA VERIFACTU\n';
        data += `Ref: ${order.verifactuHash.substring(0, 16).toUpperCase()}...\n`;
      }
      
      data += '\n';
      data += ESC + 'a' + '\x01'; // Centrar
      data += `${settings.ticketFooterText || '¡Muchas gracias por su visita!'}\n`;
      data += 'Fahma POS\n';
      data += '\n\n\n\n';
      data += GS + 'V' + '\x41' + '\x03'; // Corte de papel

      if (connectionType === 'system') {
        const path = require('path');
        const { exec } = require('child_process');
        const tempDir = process.env.TEMP || '/tmp';
        const tempBinPath = path.join(tempDir, `fahma_receipt_${Date.now()}.bin`);
        const psScriptPath = path.join(__dirname, 'print_raw.ps1');

        try {
          fs.writeFileSync(tempBinPath, data, 'latin1');
          const cmd = `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}" "${name}" "${tempBinPath}"`;
          exec(cmd, (err) => {
            try { fs.unlinkSync(tempBinPath); } catch (e) {}
            if (err) console.error(`Error al imprimir ticket de venta USB en ${name}:`, err.message);
          });
        } catch (err) {
          console.error(`Error al escribir temporal de ticket USB en ${name}:`, err.message);
        }
      } else {
        const client = new net.Socket();
        client.setTimeout(3000);
        client.connect(port, ipAddress, () => {
          client.write(data, 'latin1', () => {
            client.end();
          });
        });
        client.on('error', (err) => {
          console.error(`Error al imprimir ticket de venta Red en ${name}:`, err.message);
        });
        client.on('timeout', () => {
          client.destroy();
        });
      }
    }
  } catch (err) {
    console.error('Error en impresión de ticket de venta:', err);
  }
}

module.exports = { printOrderComanda, printOrderReceipt };
