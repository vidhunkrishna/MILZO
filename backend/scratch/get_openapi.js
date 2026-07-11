const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
const axios = require('axios');

async function getOpenApi() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const response = await axios.get(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log('Exposed Paths:');
    console.log(Object.keys(response.data.paths || {}));
  } catch (err) {
    console.error('Failed to fetch OpenAPI:', err.message);
  }
}

getOpenApi();
