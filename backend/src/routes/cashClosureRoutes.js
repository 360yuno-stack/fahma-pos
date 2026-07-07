const express = require('express');
const router = express.Router();
const CashClosure = require('../models/CashClosure');
const Order = require('../models/Order');

// GET /api/cash-closures
router.get('/', async (req, res) => {
  try {
    const closures = await CashClosure.find().populate('closedBy', 'firstName lastName username').sort({ date: -1 });
    res.json({ success: true, count: closures.length, data: closures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cash-closures
router.post('/', async (req, res) => {
  try {
    const { openingBalance = 0, actualCash = 0, closedBy, notes = '' } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'completed'
    });

    const Expense = require('../models/Expense');
    const todayExpenses = await Expense.find({
      date: { $gte: today, $lt: tomorrow }
    });

    const totalSales = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
    const cashSales = todayOrders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + (o.total || 0), 0);
    const cardSales = todayOrders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + (o.total || 0), 0);
    const totalExpenses = todayExpenses.reduce((s, e) => s + (e.amount || 0), 0);

    const expectedCash = Number((Number(openingBalance) + cashSales - totalExpenses).toFixed(2));
    const difference = Number((Number(actualCash) - expectedCash).toFixed(2));

    const closure = await CashClosure.create({
      date: today,
      openingBalance: Number(openingBalance),
      actualCash: Number(actualCash),
      expectedCash,
      difference,
      expenses: totalExpenses,
      totalSales: Math.round(totalSales * 100) / 100,
      cashSales: Math.round(cashSales * 100) / 100,
      cardSales: Math.round(cardSales * 100) / 100,
      totalOrders: todayOrders.length,
      closedBy: closedBy || null,
      notes
    });

    res.status(201).json({ success: true, data: closure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
