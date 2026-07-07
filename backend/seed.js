require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Table = require('./src/models/Table');
const Settings = require('./src/models/Settings');

const seed = async () => {
  try {
    await connectDB();
    console.log('Limpiando base de datos...');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Table.deleteMany({});
    await Settings.deleteMany({});

    // Users
    console.log('Creando usuarios...');
    const admin = await User.create({
      username: 'admin', email: 'admin@fahma.com', password: 'admin123',
      firstName: 'Admin', lastName: 'FAHMA', role: 'admin', isActive: true
    });
    await User.create({
      username: 'cajero', email: 'cajero@fahma.com', password: 'cajero123',
      firstName: 'María', lastName: 'García', role: 'cajero', isActive: true
    });

    // Categories
    console.log('Creando categorías...');
    const cats = await Category.insertMany([
      { name: 'Entrantes', icon: '🥗', color: '#4CAF50', order: 1 },
      { name: 'Platos Principales', icon: '🍽️', color: '#1976D2', order: 2 },
      { name: 'Carnes', icon: '🥩', color: '#D32F2F', order: 3 },
      { name: 'Pescados', icon: '🐟', color: '#0288D1', order: 4 },
      { name: 'Postres', icon: '🍰', color: '#7B1FA2', order: 5 },
      { name: 'Bebidas', icon: '🥤', color: '#FF9800', order: 6 }
    ]);

    // Products
    console.log('Creando productos...');
    await Product.insertMany([
      // Entrantes
      { name: 'Ensalada César', price: 8.50, cost: 3, category: cats[0]._id, sku: 'ENT001', order: 1 },
      { name: 'Croquetas de Jamón', price: 7.00, cost: 2.5, category: cats[0]._id, sku: 'ENT002', order: 2 },
      { name: 'Patatas Bravas', price: 6.50, cost: 2, category: cats[0]._id, sku: 'ENT003', order: 3 },
      { name: 'Gazpacho Andaluz', price: 5.50, cost: 1.5, category: cats[0]._id, sku: 'ENT004', order: 4 },
      // Platos Principales
      { name: 'Paella Valenciana', price: 14.00, cost: 5, category: cats[1]._id, sku: 'PLA001', order: 1 },
      { name: 'Arroz Negro', price: 13.50, cost: 5, category: cats[1]._id, sku: 'PLA002', order: 2 },
      { name: 'Tortilla Española', price: 8.00, cost: 2.5, category: cats[1]._id, sku: 'PLA003', order: 3 },
      { name: 'Pasta Carbonara', price: 11.00, cost: 3.5, category: cats[1]._id, sku: 'PLA004', order: 4 },
      // Carnes
      { name: 'Chuletón de Ávila', price: 22.00, cost: 10, category: cats[2]._id, sku: 'CAR001', order: 1 },
      { name: 'Secreto Ibérico', price: 16.00, cost: 7, category: cats[2]._id, sku: 'CAR002', order: 2 },
      { name: 'Pollo a la Brasa', price: 12.00, cost: 4, category: cats[2]._id, sku: 'CAR003', order: 3 },
      { name: 'Hamburguesa Gourmet', price: 13.50, cost: 4.5, category: cats[2]._id, sku: 'CAR004', order: 4 },
      // Pescados
      { name: 'Lubina a la Sal', price: 18.00, cost: 8, category: cats[3]._id, sku: 'PES001', order: 1 },
      { name: 'Gambas al Ajillo', price: 14.00, cost: 6, category: cats[3]._id, sku: 'PES002', order: 2 },
      { name: 'Pulpo a la Gallega', price: 16.00, cost: 7, category: cats[3]._id, sku: 'PES003', order: 3 },
      // Postres
      { name: 'Tarta de Queso', price: 6.50, cost: 2, category: cats[4]._id, sku: 'POS001', order: 1 },
      { name: 'Crema Catalana', price: 5.50, cost: 1.5, category: cats[4]._id, sku: 'POS002', order: 2 },
      { name: 'Tiramisú', price: 7.00, cost: 2.5, category: cats[4]._id, sku: 'POS003', order: 3 },
      { name: 'Helado Artesano', price: 4.50, cost: 1.5, category: cats[4]._id, sku: 'POS004', order: 4 },
      // Bebidas
      { name: 'Agua Mineral', price: 2.00, cost: 0.5, category: cats[5]._id, sku: 'BEB001', order: 1 },
      { name: 'Refresco', price: 2.50, cost: 0.7, category: cats[5]._id, sku: 'BEB002', order: 2 },
      { name: 'Cerveza', price: 3.00, cost: 0.8, category: cats[5]._id, sku: 'BEB003', order: 3 },
      { name: 'Copa de Vino', price: 4.00, cost: 1.5, category: cats[5]._id, sku: 'BEB004', order: 4 },
      { name: 'Café', price: 1.50, cost: 0.3, category: cats[5]._id, sku: 'BEB005', order: 5 },
    ]);

    // Tables
    console.log('Creando mesas...');
    await Table.insertMany([
      { name: 'Terraza 1', number: 1, zone: 'Terraza', capacity: 4 },
      { name: 'Terraza 2', number: 2, zone: 'Terraza', capacity: 4 },
      { name: 'Terraza 3', number: 3, zone: 'Terraza', capacity: 6 },
      { name: 'Terraza 4', number: 4, zone: 'Terraza', capacity: 2 },
      { name: 'Terraza 5', number: 5, zone: 'Terraza', capacity: 4 },
      { name: 'Terraza 6', number: 6, zone: 'Terraza', capacity: 8 },
      { name: 'Interior 1', number: 7, zone: 'Interior', capacity: 4 },
      { name: 'Interior 2', number: 8, zone: 'Interior', capacity: 4 },
      { name: 'Interior 3', number: 9, zone: 'Interior', capacity: 6 },
      { name: 'Interior 4', number: 10, zone: 'Interior', capacity: 2 },
      { name: 'Barra 1', number: 11, zone: 'Barra', capacity: 1 },
      { name: 'Barra 2', number: 12, zone: 'Barra', capacity: 1 },
    ]);

    // Settings
    console.log('Creando configuración...');
    await Settings.create({
      restaurantName: 'FAHMA',
      address: 'Calle Principal 1, Madrid',
      phone: '+34 900 123 456',
      email: 'info@fahma.com',
      currency: 'EUR',
      taxRate: 10
    });

    console.log('');
    console.log('✅ Seed completado:');
    console.log('   - 2 usuarios (admin/admin123, cajero/cajero123)');
    console.log('   - 6 categorías');
    console.log('   - 24 productos');
    console.log('   - 12 mesas (6 Terraza, 4 Interior, 2 Barra)');
    console.log('   - 1 configuración');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
};

seed();