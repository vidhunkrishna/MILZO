const bcrypt = require('bcryptjs');

async function main() {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash('Admin@123456', salt);
  
  console.log('');
  console.log('=== COPY & RUN THIS SQL IN SUPABASE SQL EDITOR ===');
  console.log('');
  console.log('-- Step 1: Disable RLS');
  console.log('ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('-- Step 2: Insert super admin');
  console.log(`INSERT INTO users (name, email, password, role, is_active)`);
  console.log(`VALUES ('Super Admin', 'admin@milzo.com', '${hash}', 'superAdmin', true)`);
  console.log(`ON CONFLICT (email) DO NOTHING;`);
  console.log('');
  console.log('====================================================');
}

main();
