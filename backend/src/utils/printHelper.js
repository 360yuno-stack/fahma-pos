const net = require('net');
const fs = require('fs');
const Printer = require('../models/Printer');

async function printOrderComanda(order) {
  if (process.env.IS_CLOUD_SERVER === 'true') {
    if (global.io) {
      console.log('Nube: Transmitiendo evento comanda a la caja...');
      global.io.to('printer-agent-room').emit('print:job', { type: 'comanda', order });
    } else {
      console.warn('Nube: Socket.io no inicializado en servidor.');
    }
    return;
  }

  try {
    // 1. Obtener impresoras activas
    const printers = await Printer.find({ isActive: true });
    if (printers.length === 0) return;

    for (const printer of printers) {
      const { ipAddress, port, categories, connectionType, name } = printer;
      const printerCategoryIds = categories.map(c => c.toString());

      // 2. Filtrar los artículos que corresponden a las categorías de esta impresora
      const printerItems = order.items.filter(item => {
        if (!item.product || !item.product.category) return false;
        return printerCategoryIds.includes(item.product.category.toString());
      });

      // 3. Si hay artículos, enviar comanda
      if (printerItems.length > 0) {
        const ESC = '\x1b';
        const GS = '\x1d';
        
        let data = '';
        data += ESC + '@'; // Inicializar
        data += ESC + 'a' + '\x01'; // Centrar
        data += ESC + 'E' + '\x01'; // Negrita ON
        data += `COMANDA: ${name.toUpperCase()}\n`;
        data += ESC + 'E' + '\x00'; // Negrita OFF
        
        const mesaName = order.table ? (order.table.name || `Mesa ${order.table.number}`) : 'PARA LLEVAR / DOMICILIO';
        data += `MESA / DESTINO: ${mesaName}\n`;
        data += `Pedido #: ${order.orderNumber}\n`;
        data += '-------------------------------\n\n';
        
        data += ESC + 'a' + '\x00'; // Izquierda
        for (const item of printerItems) {
          data += `${item.quantity}x ${item.name.toUpperCase()}\n`;
          if (item.modifiers && item.modifiers.length > 0) {
            data += `   * Modificadores: ${item.modifiers.join(', ')}\n`;
          }
          if (item.notes) {
            data += `   * NOTA: ${item.notes}\n`; // Casilla de anotación del producto
          }
        }
        
        if (order.notes) {
          data += '\n-------------------------------\n';
          data += `ANOTACION TICKET:\n${order.notes}\n`; // Casilla de anotación general del ticket
        }
        
        data += '-------------------------------\n';
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

async function printOrderReceipt(order) {
  if (process.env.IS_CLOUD_SERVER === 'true') {
    if (global.io) {
      console.log('Nube: Transmitiendo evento recibo a la caja...');
      global.io.to('printer-agent-room').emit('print:job', { type: 'receipt', order });
    } else {
      console.warn('Nube: Socket.io no inicializado en servidor.');
    }
    return;
  }

  try {
    // 1. Obtener impresoras de facturación activas
    let printers = await Printer.find({ isActive: true, type: 'facturacion' });
    
    // Si no hay impresoras de facturación, buscar la de barra por defecto
    if (printers.length === 0) {
      printers = await Printer.find({ isActive: true, type: 'barra' });
    }
    
    if (printers.length === 0) {
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
      data += ESC + 'a' + '\x01'; // Centrar
      
      // Encabezado Premium con formato de texto limpio
      data += ESC + 'E' + '\x01'; // Negrita ON
      data += ESC + '!' + '\x38'; // Doble alto, doble ancho
      data += 'EL FOGON\n';
      data += 'DEL AGUILA\n';
      data += ESC + '!' + '\x00'; // Normal
      data += ESC + 'E' + '\x00'; // Negrita OFF
      
      data += 'RESTAURANTE / BAR\n';
      data += 'NIF: B-12345678\n';
      data += 'Tlf: 956 00 00 00\n';
      data += 'C/ Principal, Jerez de la Frontera\n';
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
      data += '¡Muchas gracias por su visita!\n';
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
