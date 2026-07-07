const Order = require('../models/Order');

exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const orders = await Order.find({
      restaurant: req.user.restaurant,
      status: 'pagado',
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });
    
    const total = orders.reduce((sum, order) => sum + order.total, 0);
    res.json({ success: true, data: { orders, total, count: orders.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orders = await Order.find({
      restaurant: req.user.restaurant,
      status: 'pagado',
      createdAt: { $gte: today }
    });
    
    const sales = orders.reduce((sum, order) => sum + order.total, 0);
    res.json({ success: true, data: { ordersCount: orders.length, sales } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

module.exports = exports;

