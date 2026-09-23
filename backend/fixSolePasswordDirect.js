require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB Atlas');

  let sole = await User.findOne({ username: 'sole' });
  if (sole) {
    // Setting password to plain string 'gestora' and calling save() so pre('save') hashes it EXACTLY ONCE
    sole.password = 'gestora';
    sole.role = 'admin';
    sole.isActive = true;
    await sole.save();
    console.log('sole.save() ejecutado. Nueva password hash:', sole.password);

    const testMatch = await bcrypt.compare('gestora', sole.password);
    console.log('>>> VERIFICACION FINAL: bcrypt.compare("gestora", sole.password):', testMatch);
  }

  process.exit(0);
}

fixPassword();
