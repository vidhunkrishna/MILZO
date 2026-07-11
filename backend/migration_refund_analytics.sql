-- ============================================
-- MILZO - Database Migration
-- Fix Refund Counts, Revenue Deductions, and support Partial/Full Refunds
-- ============================================

-- 1. Recreate get_revenue_report to support captured, refunded, and partially_refunded statuses
CREATE OR REPLACE FUNCTION get_revenue_report(p_period TEXT DEFAULT 'monthly', p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
  date_format TEXT;
BEGIN
  CASE p_period
    WHEN 'daily' THEN date_format := 'YYYY-MM-DD';
    WHEN 'weekly' THEN date_format := 'IYYY-"W"IW';
    WHEN 'yearly' THEN date_format := 'YYYY';
    ELSE date_format := 'YYYY-MM';
  END CASE;

  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT
      TO_CHAR(created_at, date_format) AS "_id",
      SUM(CASE WHEN status = 'captured' THEN amount WHEN status = 'partially_refunded' THEN amount - COALESCE((refund->>'amount')::NUMERIC, 0) ELSE 0 END) AS revenue,
      COUNT(*) AS count,
      SUM(CASE WHEN status = 'refunded' THEN amount WHEN status = 'partially_refunded' THEN COALESCE((refund->>'amount')::NUMERIC, 0) ELSE 0 END) AS refunds
    FROM payments
    WHERE status IN ('captured', 'refunded', 'partially_refunded')
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
    GROUP BY TO_CHAR(created_at, date_format)
    ORDER BY "_id"
  ) t;
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- 2. Update get_dashboard_stats to correctly compute net revenue (including partially refunded remaining balance)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  today_start TIMESTAMPTZ;
  today_end TIMESTAMPTZ;
  month_start TIMESTAMPTZ;
BEGIN
  today_start := DATE_TRUNC('day', NOW());
  today_end := today_start + INTERVAL '1 day';
  month_start := DATE_TRUNC('month', NOW());

  SELECT json_build_object(
    'totalCustomers', (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL),
    'activeSubscriptions', (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'morningOrders', (SELECT COUNT(*) FROM orders WHERE delivery_slot = 'morning' AND delivery_date >= today_start::DATE AND delivery_date < today_end::DATE),
    'eveningOrders', (SELECT COUNT(*) FROM orders WHERE delivery_slot = 'evening' AND delivery_date >= today_start::DATE AND delivery_date < today_end::DATE),
    'pendingDeliveries', (SELECT COUNT(*) FROM orders WHERE status IN ('placed', 'confirmed', 'packed', 'assigned', 'out_for_delivery')),
    'deliveredOrders', (SELECT COUNT(*) FROM orders WHERE status = 'delivered' AND delivery_date >= today_start::DATE AND delivery_date < today_end::DATE),
    'revenueToday', COALESCE((SELECT SUM(CASE WHEN status = 'captured' THEN amount WHEN status = 'partially_refunded' THEN amount - COALESCE((refund->>'amount')::NUMERIC, 0) ELSE 0 END) FROM payments WHERE status IN ('captured', 'partially_refunded') AND created_at >= today_start AND created_at < today_end), 0),
    'revenueThisMonth', COALESCE((SELECT SUM(CASE WHEN status = 'captured' THEN amount WHEN status = 'partially_refunded' THEN amount - COALESCE((refund->>'amount')::NUMERIC, 0) ELSE 0 END) FROM payments WHERE status IN ('captured', 'partially_refunded') AND created_at >= month_start AND created_at < today_end), 0),
    'activeVendors', (SELECT COUNT(*) FROM vendors WHERE status = 'active'),
    'activeAgents', (SELECT COUNT(*) FROM delivery_agents WHERE status = 'active'),
    'openComplaints', (SELECT COUNT(*) FROM feedback WHERE type = 'complaint' AND status IN ('open', 'in_progress'))
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
