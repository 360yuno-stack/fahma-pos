const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/category.controller');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'No autorizado' });
  next();
};

router.get('/', ctrl.getAllCategories);
router.get('/:id', ctrl.getCategoryById);
router.post('/', auth, ctrl.createCategory);
router.put('/:id', auth, ctrl.updateCategory);
router.delete('/:id', auth, ctrl.deleteCategory);
router.put('/order/update', auth, ctrl.updateCategoriesOrder);

module.exports = router;
