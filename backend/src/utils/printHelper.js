const net = require('net');
const fs = require('fs');
const Printer = require('../models/Printer');

async function printOrderComanda(order) {
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

module.exports = { printOrderComanda };
