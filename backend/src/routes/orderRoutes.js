const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const Table = require('../models/Table');
const VerifactuConfig = require('../models/VerifactuConfig');

// Helper to generate VeriFactu Hash
async function generateVerifactuHash(order) {
  try {
    const config = await VerifactuConfig.findOne();
    if (!config || !config.isActive) return null;

    const previousOrder = await Order.findOne({ verifactuHash: { $ne: null } }).sort({ createdAt: -1 });
    const previousHash = previousOrder ? previousOrder.verifactuHash : '';
    
    // Hash format: PreviousHash + OrderNumber (or ID) + Total + Date + NIF
    const dataToHash = `${previousHash}${order._id}${order.total}${new Date().toISOString()}${config.nif}`;
    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    // In a real scenario, this would generate the XML and send it via Certificate
    // Here we simulate the successful chain block
    order.verifactuHash = hash;
    order.verifactuPreviousHash = previousHash;
    order.verifactuSent = true;
    order.verifactuDate = new Date();
    
    // Save last hash in config
    config.lastInvoiceHash = hash;
    await config.save();
    
    return hash;
  } catch (error) {
    console.error("VeriFactu Error:", error);
    return null;
  }
}

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const { from, to, status, table, limit = 100 } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from + 'T00:00:00.000Z');
      if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
    }
    if (status && status !== 'all') filter.status = status;
    if (table) filter.table = table;

    const orders = await Order.find(filter)
      .populate('table', 'name number zone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('table', 'name number zone');
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { lines, items, total, paymentMethod, tableId, table: tableRef, type, status, notes } = req.body;
    const orderItems = items || (lines || []).map(l => ({
      product: l.productId || l.product,
      name: l.nombre || l.name,
      quantity: l.qty || l.quantity || 1,
      price: l.precio || l.price,
      subtotal: (l.precio || l.price) * (l.qty || l.quantity || 1)
    }));

    const orderTotal = total || orderItems.reduce((s, i) => s + (i.subtotal || i.price * i.quantity), 0);
    const subtotal = orderTotal / 1.10;
    const taxes = orderTotal - subtotal;

    // Mapear métodos de pago a enums válidos en la base de datos
    let mappedPaymentMethod = 'cash';
    if (paymentMethod === 'tarjeta' || paymentMethod === 'card') {
      mappedPaymentMethod = 'card';
    } else if (paymentMethod === 'efectivo' || paymentMethod === 'cash') {
      mappedPaymentMethod = 'cash';
    }

    // Mapear estado a enums válidos en la base de datos
    let mappedStatus = 'pending';
    if (status === 'completed' || status === 'paid') {
      mappedStatus = 'completed';
    } else if (status === 'preparing') {
      mappedStatus = 'preparing';
    } else if (status === 'ready') {
      mappedStatus = 'ready';
    } else if (status === 'cancelled') {
      mappedStatus = 'cancelled';
    }

    const order = new Order({
      table: tableId || tableRef || null,
      type: type || 'dine-in',
      items: orderItems,
      subtotal,
      taxes,
      total: orderTotal,
      paymentMethod: mappedPaymentMethod,
      status: mappedStatus,
      notes: notes || ''
    });

    if (order.status === 'completed') {
      await generateVerifactuHash(order);
      order.paidAt = new Date();
    }

    const saved = await order.save();

    if (saved.table) {
      if (saved.status === 'completed') {
        await Table.findByIdAndUpdate(saved.table, { status: 'free', currentOrder: null });
      } else {
        await Table.findByIdAndUpdate(saved.table, { status: 'occupied', currentOrder: saved._id });
      }
    }

    const populated = await Order.findById(saved._id)
      .populate('table', 'name number zone')
      .populate('items.product', 'category name price');

    // Imprimir comanda y/o recibo automáticamente
    try {
      const { printOrderComanda, printOrderReceipt } = require('../utils/printHelper');
      printOrderComanda(populated);
      if (saved.status === 'completed') {
        printOrderReceipt(populated);
      }
    } catch (printErr) {
      console.error('Error en impresión automática en creación de pedido:', printErr);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error POST /api/orders:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (status) {
      if (status === 'paid' || status === 'completed') {
        order.status = 'completed';
      } else {
        order.status = status;
      }
    }
    
    if (paymentMethod) {
      if (paymentMethod === 'tarjeta' || paymentMethod === 'card') {
        order.paymentMethod = 'card';
      } else if (paymentMethod === 'efectivo' || paymentMethod === 'cash') {
        order.paymentMethod = 'cash';
      } else {
        order.paymentMethod = paymentMethod;
      }
    }

    if (order.status === 'completed') {
      order.paidAt = new Date();
      if (!order.verifactuHash) {
        await generateVerifactuHash(order);
      }
      if (order.table) {
        await Table.findByIdAndUpdate(order.table, { status: 'free', currentOrder: null });
      }
    }
    
    await order.save();
    
    // Si se ha cobrado, imprimir ticket de venta automáticamente
    if (order.status === 'completed') {
      try {
        const populated = await Order.findById(order._id)
          .populate('table', 'name number zone')
          .populate('items.product', 'category name price');
        const { printOrderReceipt } = require('../utils/printHelper');
        printOrderReceipt(populated);
      } catch (printErr) {
        console.error('Error al imprimir recibo en cambio de estado:', printErr);
      }
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders/:id/print - Re-imprimir ticket (comanda o recibo)
router.post('/:id/print', async (req, res) => {
  try {
    const { type = 'receipt' } = req.body; // 'comanda' o 'receipt'
    const order = await Order.findById(req.params.id)
      .populate('table', 'name number zone')
      .populate('items.product', 'category name price');
      
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    const { printOrderComanda, printOrderReceipt } = require('../utils/printHelper');
    
    if (type === 'comanda') {
      await printOrderComanda(order);
      res.json({ success: true, message: 'Comanda enviada a las impresoras' });
    } else {
      await printOrderReceipt(order);
      res.json({ success: true, message: 'Ticket de venta enviado a las impresoras' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
