require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const CashClosure = require('./src/models/CashClosure');
const Shift = require('./src/models/Shift');
const Table = require('./src/models/Table');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fahma_pos';

async function run() {
  console.log('Conectando a la base de datos...');
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Conexión establecida con éxito.');

    // 1. Eliminar todos los pedidos
    console.log('Eliminando pedidos...');
    const orderRes = await Order.deleteMany({});
    console.log(`✅ Se eliminaron ${orderRes.deletedCount} pedidos.`);

    // 2. Eliminar cierres de caja
    console.log('Eliminando cierres de caja...');
    const closureRes = await CashClosure.deleteMany({});
    console.log(`✅ Se eliminaron ${closureRes.deletedCount} cierres de caja.`);

    // 3. Eliminar turnos de equipo
    console.log('Eliminando turnos...');
    const shiftRes = await Shift.deleteMany({});
    console.log(`✅ Se eliminaron ${shiftRes.deletedCount} turnos.`);

    // 4. Restablecer el estado de todas las mesas a 'free' y limpiar sus pedidos actuales
    console.log('Restableciendo estado de las mesas...');
    const tableRes = await Table.updateMany({}, { status: 'free', currentOrder: null });
    console.log(`✅ Se restablecieron ${tableRes.modifiedCount} mesas.`);

    console.log('\n======================================================');
    WriteLog('¡BASE DE DATOS DE TRANSACCIONES LIMPIADA CON ÉXITO!');
    console.log('Los productos, categorías, usuarios y configuraciones');
    console.log('se han conservado intactos. El TPV está listo para usar.');
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Error durante la limpieza:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

function WriteLog(msg) {
  console.log(`\x1b[32m${msg}\x1b[0m`);
}

run();
