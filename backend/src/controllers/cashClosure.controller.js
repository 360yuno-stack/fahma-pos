const CashClosure = require('../models/CashClosure');
const Order = require('../models/Order');

// GET /api/cash-closures - Get all cash closures
exports.getAll = async (req, res) => {
  try {
    const closures = await CashClosure.find()
      .populate('closedBy', 'username firstName lastName')
      .sort({ date: -1 });
    res.json({ success: true, count: closures.length, data: closures });
  } catch (error) {
    console.error('Error getting cash closures:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/cash-closures - Create cash closure (calculates from orders)
exports.create = async (req, res) => {
  try {
    const { openingBalance = 0, notes = '', closedBy = null } = req.body;

    // Calculate today's totals from paid orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paidOrders = await Order.find({
      paidAt: { $gte: today, $lt: tomorrow },
      status: 'paid'
    });

    const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const cashSales = paidOrders
      .filter(o => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + o.total, 0);
    const cardSales = paidOrders
      .filter(o => o.paymentMethod === 'card')
      .reduce((sum, o) => sum + o.total, 0);

    const closure = await CashClosure.create({
      date: new Date(),
      openingBalance,
      totalSales: Math.round(totalSales * 100) / 100,
      cashSales: Math.round(cashSales * 100) / 100,
      cardSales: Math.round(cardSales * 100) / 100,
      totalOrders: paidOrders.length,
      closedBy,
      notes
    });

    const populated = await CashClosure.findById(closure._id)
      .populate('closedBy', 'username firstName lastName');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error creating cash closure:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/cash-closures/current - Get current day summary (without closing)
exports.getCurrent = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paidOrders = await Order.find({
      paidAt: { $gte: today, $lt: tomorrow },
      status: 'paid'
    });

    const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const cashSales = paidOrders
      .filter(o => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + o.total, 0);
    const cardSales = paidOrders
      .filter(o => o.paymentMethod === 'card')
      .reduce((sum, o) => sum + o.total, 0);

    res.json({
      success: true,
      data: {
        date: today,
        totalSales: Math.round(totalSales * 100) / 100,
        cashSales: Math.round(cashSales * 100) / 100,
        cardSales: Math.round(cardSales * 100) / 100,
        totalOrders: paidOrders.length,
        isClosed: false
      }
    });
  } catch (error) {
    console.error('Error getting current closure:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
