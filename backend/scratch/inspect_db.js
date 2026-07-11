const path = require('path');
require('dotenv').config();
const supabase = require('../config/supabase');

async function inspect() {
  try {
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .ilike('proname', '%sql%');
    
    if (error) {
      console.error('Error fetching functions:', error);
      // Try querying information_schema
      const { data: data2, error: error2 } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .ilike('routine_name', '%sql%');
      if (error2) {
        console.error('Error fetching from information_schema:', error2);
        return;
      }
      console.log('SQL functions from information_schema:', data2);
      return;
    }
    console.log('SQL functions in database:', data);
  } catch (err) {
    console.error('Inspect failed:', err);
  }
}

inspect();
