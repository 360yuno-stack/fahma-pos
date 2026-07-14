require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./src/config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Permitir cualquier origen si estamos en desarrollo local, o si está configurado en las variables de entorno
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS'), false);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/tables', require('./src/routes/tableRoutes'));
app.use('/api/reservations', require('./src/routes/reservationRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/cash-closures', require('./src/routes/cashClosureRoutes'));
app.use('/api/settings', require('./src/routes/settingsRoutes'));
app.use('/api/clients', require('./src/routes/clientRoutes'));
app.use('/api/expenses', require('./src/routes/expenseRoutes'));
app.use('/api/shifts', require('./src/routes/shiftRoutes'));
app.use('/api/providers', require('./src/routes/providerRoutes'));
app.use('/api/ingredients', require('./src/routes/ingredientRoutes'));
app.use('/api/modifiers', require('./src/routes/modifierRoutes'));
app.use('/api/printers', require('./src/routes/printerRoutes'));
app.use('/api/attendance', require('./src/routes/attendanceRoutes'));
app.use('/api/verifactu', require('./src/routes/verifactuRoutes'));
app.use('/api/invoices', require('./src/routes/invoiceRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FAHMA POS API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('===========================================');
  console.log('  FAHMA POS Backend corriendo en puerto ' + PORT);
  console.log('  Modo: ' + (process.env.NODE_ENV || 'production'));
  console.log('  API: http://localhost:' + PORT + '/api');
  console.log('===========================================');
  console.log('');
});

// Inicializar Socket.io
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);
global.io = io;

io.on('connection', (socket) => {
  console.log('Cliente Socket.io conectado:', socket.id);
  
  // Registrar el agente de impresión de la caja
  socket.on('join:printer-agent', () => {
    socket.join('printer-agent-room');
    console.log('🔌 Agente de impresión local de la caja registrado y listo.');
  });

  socket.on('disconnect', () => {
    console.log('Cliente Socket.io desconectado:', socket.id);
  });
});

// Si estamos en la caja (local) y se ha configurado CLOUD_BRIDGE_URL,
// actuar como puente cliente para retransmitir las impresiones de la nube
if (process.env.CLOUD_BRIDGE_URL) {
  console.log(`🔌 Iniciando puente cliente de impresión hacia: ${process.env.CLOUD_BRIDGE_URL}`);
  const { io: ioClient } = require('socket.io-client');
  const clientSocket = ioClient(process.env.CLOUD_BRIDGE_URL);

  clientSocket.on('connect', () => {
    console.log('✅ Puente de Impresión: Conectado al servidor en la nube.');
    clientSocket.emit('join:printer-agent');
  });

  clientSocket.on('print:job', async (job) => {
    console.log(`🖨️  Puente de Impresión: Recibido trabajo de impresión (${job.type})`);
    try {
      const { printOrderComanda, printOrderReceipt } = require('./src/utils/printHelper');
      if (job.type === 'comanda') {
        await printOrderComanda(job.order);
      } else if (job.type === 'receipt') {
        await printOrderReceipt(job.order);
      }
    } catch (err) {
      console.error('Error al ejecutar impresión puente:', err.message);
    }
  });

  clientSocket.on('disconnect', () => {
    console.log('⚠️  Puente de Impresión: Conexión perdida con la nube. Reintentando...');
  });
}

process.on('unhandledRejection', (err) => {
  console.error('Error no capturado:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
