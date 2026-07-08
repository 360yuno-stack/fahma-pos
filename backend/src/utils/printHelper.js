const net = require('net');
const Printer = require('../models/Printer');

async function printOrderComanda(order) {
  try {
    // 1. Obtener impresoras activas
    const printers = await Printer.find({ isActive: true });
    if (printers.length === 0) return;

    for (const printer of printers) {
      if (printer.connectionType === 'system') continue; // Impresora local omitida en el cloud
      
      const { ipAddress, port, categories } = printer;
      if (!ipAddress) continue;

      const printerCategoryIds = categories.map(c => c.toString());

      // 2. Filtrar los artículos que corresponden a las categorías de esta impresora
      const printerItems = order.items.filter(item => {
        if (!item.product || !item.product.category) return false;
        return printerCategoryIds.includes(item.product.category.toString());
      });

      // 3. Si hay artículos, enviar comanda
      if (printerItems.length > 0) {
        console.log(`Impresión automática: Enviando ${printerItems.length} artículos a ${printer.name} (${ipAddress}:${port})...`);
        
        const client = new net.Socket();
        client.setTimeout(3000);

        client.connect(port, ipAddress, () => {
          const ESC = '\x1b';
          const GS = '\x1d';
          
          let data = '';
          data += ESC + '@'; // Inicializar
          data += ESC + 'a' + '\x01'; // Centrar
          data += ESC + 'E' + '\x01'; // Negrita ON
          data += `COMANDA: ${printer.name.toUpperCase()}\n`;
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

          client.write(data, 'latin1', () => {
            client.end();
            console.log(`Comanda impresa en ${printer.name} con éxito.`);
          });
        });

        client.on('error', (err) => {
          console.error(`Error de impresión automática en ${printer.name} (${ipAddress}:${port}):`, err.message);
        });

        client.on('timeout', () => {
          client.destroy();
          console.error(`Tiempo de espera agotado en ${printer.name} (${ipAddress}:${port})`);
        });
      }
    }
  } catch (err) {
    console.error('Error en el proceso de impresión automática:', err);
  }
}

module.exports = { printOrderComanda };
