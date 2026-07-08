const Order = require('../models/Order');
const Table = require('../models/Table');

// GET /api/orders - Get all orders with filters
exports.getAll = async (req, res) => {
  try {
    const { status, table, date, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (table) {
      filter.table = table;
    }
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: dayStart, $lte: dayEnd };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('table', 'name number zone')
      .populate('server', 'username firstName lastName')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: orders
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders/:id - Get order by ID
exports.getById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'name number zone')
      .populate('server', 'username firstName lastName')
      .populate('items.product', 'name price');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/orders - Create order (auto-calc totals)
exports.create = async (req, res) => {
  try {
    const { items, table, type, paymentMethod, server, customer, notes, discount = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }

    // Calculate subtotals for each item
    const processedItems = items.map(item => ({
      product: item.product,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.quantity * item.price,
      modifiers: item.modifiers || [],
      notes: item.notes || ''
    }));

    // Calculate totals
    const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxRate = 10; // Default 10%
    const taxes = Math.round((subtotal * taxRate / 100) * 100) / 100;
    const total = Math.round((subtotal + taxes - discount) * 100) / 100;

    const order = new Order({
      items: processedItems,
      table: table || null,
      type: type || 'dine-in',
      status: 'pending',
      subtotal,
      taxes,
      discount,
      total,
      paymentMethod: paymentMethod || '',
      server: server || null,
      customer: customer || {},
      notes: notes || ''
    });

    await order.save();

    // If dine-in with table, mark table as occupied
    if (table) {
      await Table.findByIdAndUpdate(table, {
        status: 'occupied',
        currentOrder: order._id
      });
    }

    const populated = await Order.findById(order._id)
      .populate('table', 'name number zone')
      .populate('server', 'username firstName lastName')
      .populate('items.product', 'category name price');

    // Imprimir comandas automáticamente (BARRA / COCINA)
    try {
      const { printOrderComanda } = require('../utils/printHelper');
      printOrderComanda(populated);
    } catch (printErr) {
      console.error('Error al lanzar impresión automática:', printErr);
    }

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.emit('order:created', populated);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/orders/:id/status - Update order status
exports.updateStatus = async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;

    if (status === 'paid') {
      order.paidAt = new Date();
      if (paymentMethod) {
        order.paymentMethod = paymentMethod;
      }
      // Free the table
      if (order.table) {
        await Table.findByIdAndUpdate(order.table, {
          status: 'free',
          currentOrder: null
        });
      }
    }

    if (status === 'cancelled' && order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: 'free',
        currentOrder: null
      });
    }

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('table', 'name number zone')
      .populate('server', 'username firstName lastName');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('order:updated', populated);
    }

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/orders/:id - Delete order
exports.delete = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Free the table if needed
    if (order.table && order.status !== 'paid' && order.status !== 'cancelled') {
      await Table.findByIdAndUpdate(order.table, {
        status: 'free',
        currentOrder: null
      });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders/stats - Get order stats for dashboard
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFilter = {
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    };

    const todayOrders = await Order.find(todayFilter);
    const paidOrders = todayOrders.filter(o => o.status === 'paid');

    const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = todayOrders.length;
    const avgTicket = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;
    const cashSales = paidOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const cardSales = paidOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0);

    res.json({
      success: true,
      data: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        avgTicket: Math.round(avgTicket * 100) / 100,
        cashSales: Math.round(cashSales * 100) / 100,
        cardSales: Math.round(cardSales * 100) / 100,
        paidOrders: paidOrders.length
      }
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};