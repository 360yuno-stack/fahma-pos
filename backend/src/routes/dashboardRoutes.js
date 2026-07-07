const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const { from, to } = req.query;
    let filter = { status: { $ne: 'cancelled' } };

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from + 'T00:00:00.000Z');
      if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filter.createdAt = { $gte: today, $lt: tomorrow };
    }

    const periodOrders = await Order.find(filter).populate('table', 'name number').lean();
    const completedOrders = periodOrders.filter(o => o.status === 'completed');

    const totalSales = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = periodOrders.length;
    const avgTicket = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;

    const tables = await Table.find();
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;

    const cashSales = completedOrders
      .filter(o => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const cardSales = completedOrders
      .filter(o => o.paymentMethod === 'card')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const totalTaxes = completedOrders.reduce((sum, o) => sum + (o.taxes || 0), 0);

    // Calcular productos más vendidos
    const productStats = {};
    completedOrders.forEach(order => {
      // Si el pedido tiene items (estructura Mongoose)
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const key = item.name;
          if (!productStats[key]) {
            productStats[key] = { name: key, quantity: 0, revenue: 0 };
          }
          productStats[key].quantity += (item.quantity || 1);
          productStats[key].revenue += (item.subtotal || item.price * item.quantity || 0);
        });
      } 
      // Si el pedido tiene lines (estructura TPV)
      else if (order.lines && order.lines.length > 0) {
        order.lines.forEach(line => {
          const key = line.nombre || line.name;
          if (!productStats[key]) {
            productStats[key] = { name: key, quantity: 0, revenue: 0 };
          }
          productStats[key].quantity += (line.qty || line.quantity || 1);
          productStats[key].revenue += (line.subtotal || (line.precio || line.price) * (line.qty || line.quantity || 1) || 0);
        });
      }
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        quantity: p.quantity,
        revenue: Math.round(p.revenue * 100) / 100
      }));

    const recentOrders = await Order.find()
      .populate('table', 'name number')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        avgTicket: Math.round(avgTicket * 100) / 100,
        occupiedTables,
        totalTables: tables.length,
        cashSales: Math.round(cashSales * 100) / 100,
        cardSales: Math.round(cardSales * 100) / 100,
        totalTaxes: Math.round(totalTaxes * 100) / 100,
        paidOrders: completedOrders.length,
        pendingOrders: periodOrders.filter(o => o.status === 'pending').length,
        preparingOrders: periodOrders.filter(o => o.status === 'preparing').length,
        topProducts,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Error dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
