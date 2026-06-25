const bcrypt = require('bcryptjs');
const supabase = require('./supabase');
const logger = require('../utils/logger');

/**
 * Seed super admin user if none exists
 * Uses raw SQL via rpc to bypass RLS policies
 */
const seedSuperAdmin = async () => {
  try {
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@milzo.com').toLowerCase();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';

    // Check if any super admin exists
    const { data: existing, error: checkErr } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'superAdmin')
      .limit(1);

    if (checkErr) {
      logger.error(`Seed check error: ${checkErr.message}`);
      return;
    }

    if (existing && existing.length > 0) {
      logger.info('Super admin already exists, skipping seed');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(superAdminPassword, salt);

    // Try normal insert first
    const { error: insertErr } = await supabase
      .from('users')
      .insert({
        name: 'Super Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'superAdmin',
        is_active: true,
      });

    if (insertErr) {
      // If RLS blocks the insert, use raw SQL via rpc to bypass it
      if (insertErr.message.includes('row-level security')) {
        logger.warn('RLS blocked seed insert, attempting via raw SQL...');

        const { error: rpcErr } = await supabase.rpc('seed_super_admin', {
          p_name: 'Super Admin',
          p_email: superAdminEmail,
          p_password: hashedPassword,
          p_role: 'superAdmin',
        });

        if (rpcErr) {
          logger.error(`Seed RPC error: ${rpcErr.message}`);
          logger.info('=== TO FIX THIS ===');
          logger.info('Run this SQL in your Supabase SQL Editor:');
          logger.info('---');
          logger.info(`CREATE OR REPLACE FUNCTION seed_super_admin(p_name TEXT, p_email TEXT, p_password TEXT, p_role user_role)`);
          logger.info(`RETURNS VOID AS $$`);
          logger.info(`BEGIN`);
          logger.info(`  INSERT INTO users (name, email, password, role, is_active)`);
          logger.info(`  VALUES (p_name, p_email, p_password, p_role, true)`);
          logger.info(`  ON CONFLICT (email) DO NOTHING;`);
          logger.info(`END;`);
          logger.info(`$$ LANGUAGE plpgsql SECURITY DEFINER;`);
          logger.info('---');
          logger.info('OR simply disable RLS: ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
          return;
        }

        logger.info(`Seeded initial Super Admin account via RPC: ${superAdminEmail}`);
      } else {
        logger.error(`Seed insert error: ${insertErr.message}`);
      }
      return;
    }

    logger.info(`Seeded initial Super Admin account: ${superAdminEmail}`);
  } catch (error) {
    logger.error(`Seed error: ${error.message}`);
  }
};

module.exports = seedSuperAdmin;
