require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Table = require("../models/Table");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
};

const seedData = async () => {
  try {
    await connectDB();
    console.log("Conectado a MongoDB");

    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Table.deleteMany();

    console.log("Datos anteriores eliminados");

    await User.create({
      username: "admin",
      email: "admin@fahma.com",
      password: "admin123",
      role: "admin",
      firstName: "Administrador",
      lastName: "Sistema"
    });

    await User.create({
      username: "cajero",
      email: "cajero@fahma.com",
      password: "cajero123",
      role: "cajero",
      firstName: "Juan",
      lastName: "Pérez"
    });

    console.log("Usuarios creados");

    const categories = await Category.insertMany([
      { name: "Entrantes", icon: "salad", color: "#10B981", order: 1 },
      { name: "Platos Principales", icon: "food", color: "#F59E0B", order: 2 },
      { name: "Carnes", icon: "meat", color: "#EF4444", order: 3 },
      { name: "Pescados", icon: "fish", color: "#3B82F6", order: 4 },
      { name: "Postres", icon: "cake", color: "#EC4899", order: 5 },
      { name: "Bebidas", icon: "drink", color: "#06B6D4", order: 6 }
    ]);

    console.log("Categorias creadas");

    await Product.insertMany([
      {
        name: "Ensalada Cesar",
        description: "Lechuga romana pollo parmesano",
        price: 8.50,
        cost: 3.20,
        category: categories[0]._id,
        isAvailable: true
      },
      {
        name: "Croquetas Caseras",
        description: "6 unidades de jamon iberico",
        price: 7.90,
        cost: 2.50,
        category: categories[0]._id,
        isAvailable: true
      },
      {
        name: "Paella Valenciana",
        description: "Arroz con pollo y verduras",
        price: 16.50,
        cost: 6.80,
        category: categories[1]._id,
        isAvailable: true
      },
      {
        name: "Solomillo de Ternera",
        description: "Con patatas y verduras",
        price: 22.00,
        cost: 9.50,
        category: categories[2]._id,
        isAvailable: true
      },
      {
        name: "Lubina a la Sal",
        description: "Lubina fresca al horno",
        price: 19.50,
        cost: 8.20,
        category: categories[3]._id,
        isAvailable: true
      },
      {
        name: "Tiramisu",
        description: "Postre italiano tradicional",
        price: 6.50,
        cost: 2.10,
        category: categories[4]._id,
        isAvailable: true
      },
      {
        name: "Coca Cola",
        description: "33cl",
        price: 2.50,
        cost: 0.60,
        category: categories[5]._id,
        isAvailable: true
      }
    ]);

    console.log("Productos creados");

    const tables = [];
    for (let i = 1; i <= 12; i++) {
      tables.push({
        number: String(i),
        name: "Mesa " + i,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        status: "available",
        zone: i <= 6 ? "Terraza" : "Interior"
      });
    }
    await Table.insertMany(tables);

    console.log("Mesas creadas");
    console.log("");
    console.log("===========================================");
    console.log("BASE DE DATOS POBLADA EXITOSAMENTE");
    console.log("===========================================");
    console.log("");
    console.log("Credenciales:");
    console.log("  Admin - Usuario: admin Password: admin123");
    console.log("  Cajero - Usuario: cajero Password: cajero123");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

seedData();
