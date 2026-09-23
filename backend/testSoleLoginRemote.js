require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}

const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
const axios = require('axios');

async function testLogin() {
  console.log('=== TEST 1: Direct MongoDB check for user "sole" ===');
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ username: 'sole' }).select('+password');
  console.log('User found:', user ? {
    id: user._id,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    passwordHash: user.password
  } : 'NOT FOUND');

  if (user) {
    const isMatch = await bcrypt.compare('gestora', user.password);
    console.log('bcrypt.compare("gestora", user.password):', isMatch);
  }

  console.log('\n=== TEST 2: HTTP POST to Render backend https://fahma-pos.onrender.com/api/auth/login ===');
  try {
    const res = await axios.post('https://fahma-pos.onrender.com/api/auth/login', {
      username: 'sole',
      password: 'gestora'
    });
    console.log('Render Login Response SUCCESS:', res.data);
  } catch (err) {
    console.error('Render Login Response ERROR:', err.response ? err.response.data : err.message);
  }

  console.log('\n=== TEST 3: Case sensitivity test (Sole vs sole) ===');
  try {
    const res2 = await axios.post('https://fahma-pos.onrender.com/api/auth/login', {
      username: 'Sole',
      password: 'gestora'
    });
    console.log('Render Login (capital S "Sole") SUCCESS:', res2.data);
  } catch (err) {
    console.error('Render Login (capital S "Sole") ERROR:', err.response ? err.response.data : err.message);
  }

  process.exit(0);
}

testLogin();
