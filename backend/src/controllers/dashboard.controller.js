const Order = require('../models/Order');
const Table = require('../models/Table');

// GET /api/dashboard/stats - Get dashboard stats
exports.getStats = async (req, res) => {
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

    const periodOrders = await Order.find(filter);
    const completedOrders = periodOrders.filter(o => o.status === 'completed');

    const totalSales = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = periodOrders.length;
    const avgTicket = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;

    const occupiedTables = await Table.countDocuments({ status: 'occupied' });
    const totalTables = await Table.countDocuments();

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
      order.items.forEach(item => {
        const key = item.name;
        if (!productStats[key]) {
          productStats[key] = { name: key, quantity: 0, revenue: 0 };
        }
        productStats[key].quantity += (item.quantity || 1);
        productStats[key].revenue += (item.subtotal || item.price * item.quantity || 0);
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        quantity: p.quantity,
        revenue: Math.round(p.revenue * 100) / 100
      }));

    res.json({
      success: true,
      data: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        avgTicket: Math.round(avgTicket * 100) / 100,
        occupiedTables,
        totalTables,
        cashSales: Math.round(cashSales * 100) / 100,
        cardSales: Math.round(cardSales * 100) / 100,
        totalTaxes: Math.round(totalTaxes * 100) / 100,
        paidOrders: completedOrders.length,
        pendingOrders: periodOrders.filter(o => o.status === 'pending').length,
        preparingOrders: periodOrders.filter(o => o.status === 'preparing').length,
        topProducts
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dashboard/sales-chart - Get hourly sales data for chart
exports.getSalesChart = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const orders = await Order.find({
      createdAt: { $gte: targetDate, $lt: nextDay },
      status: 'paid'
    });

    // Build hourly data (8am to midnight)
    const hourlyData = [];
    for (let hour = 8; hour <= 23; hour++) {
      const hourOrders = orders.filter(o => {
        const h = new Date(o.createdAt).getHours();
        return h === hour;
      });
      hourlyData.push({
        hour: `${hour}:00`,
        sales: Math.round(hourOrders.reduce((sum, o) => sum + o.total, 0) * 100) / 100,
        orders: hourOrders.length
      });
    }

    res.json({ success: true, data: hourlyData });
  } catch (error) {
    console.error('Error getting sales chart:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
