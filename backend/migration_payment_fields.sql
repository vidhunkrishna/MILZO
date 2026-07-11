-- ============================================
-- MILZO - Database Migration
-- Add JSONB 'payment' column to 'orders' table
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment JSONB DEFAULT '{}';
