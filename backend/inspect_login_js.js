const axios = require('axios');

async function downloadAndInspect() {
  try {
    const url = 'https://elfogondelaguila.foodeoadmin.com/assets/login-Dpz9o5Ba.js';
    const res = await axios.get(url);
    console.log('CONTENT:');
    console.log(res.data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

downloadAndInspect();
