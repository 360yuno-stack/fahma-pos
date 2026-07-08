const axios = require('axios');

async function testCors() {
  try {
    console.log('Probando CORS preflight contra tu servidor de Render...');
    const res = await axios({
      method: 'OPTIONS',
      url: 'https://fahma-pos.onrender.com/api/health',
      headers: {
        'Origin': 'https://fahma-pos.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    console.log('\n--- HEADERS DEVUELTOS ---');
    console.log(res.headers);
  } catch (err) {
    console.error('Error in OPTIONS request:', err.message);
    if (err.response) {
      console.log('Response status:', err.response.status);
      console.log('Response headers:', err.response.headers);
    }
  }
}

testCors();
