-- ============================================
-- MILZO - Database Migration
-- Safely add the 'customer' role to user_role enum
-- ============================================

ALTER TYPE user_role ADD VALUE 'customer';
