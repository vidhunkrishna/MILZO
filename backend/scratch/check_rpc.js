const path = require('path');
require('dotenv').config();
const supabase = require('../config/supabase');

async function test() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    console.log('exec_sql response:', { data, error });
  } catch (err) {
    console.error('exec_sql threw error:', err);
  }
}

test();
