const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET todas las categorias (SIN autenticacion)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort('nombre');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
