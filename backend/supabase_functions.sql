-- ============================================
-- MILZO - Supabase RPC Functions
-- Run this in Supabase SQL Editor AFTER schema
-- ============================================

-- ============================================
-- DASHBOARD FUNCTIONS
-- ============================================

-- Get all dashboard stats in one call
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
    'revenueToday', COALESCE((SELECT SUM(amount) FROM payments WHERE status = 'captured' AND created_at >= today_start AND created_at < today_end), 0),
    'revenueThisMonth', COALESCE((SELECT SUM(amount) FROM payments WHERE status = 'captured' AND created_at >= month_start AND created_at < today_end), 0),
    'activeVendors', (SELECT COUNT(*) FROM vendors WHERE status = 'active'),
    'activeAgents', (SELECT COUNT(*) FROM delivery_agents WHERE status = 'active'),
    'openComplaints', (SELECT COUNT(*) FROM feedback WHERE type = 'complaint' AND status IN ('open', 'in_progress'))
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Revenue graph (last N days)
CREATE OR REPLACE FUNCTION get_revenue_graph(p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT
      TO_CHAR(created_at, 'YYYY-MM-DD') AS "_id",
      SUM(amount) AS revenue,
      COUNT(*) AS count
    FROM payments
    WHERE status = 'captured' AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY "_id"
  ) t;
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Order trends (by date and slot)
CREATE OR REPLACE FUNCTION get_order_trends(p_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT
      json_build_object('date', TO_CHAR(delivery_date, 'YYYY-MM-DD'), 'slot', delivery_slot) AS "_id",
      COUNT(*) AS count
    FROM orders
    WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY TO_CHAR(delivery_date, 'YYYY-MM-DD'), delivery_slot
    ORDER BY TO_CHAR(delivery_date, 'YYYY-MM-DD')
  ) t;
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Delivery performance (last 7 days)
CREATE OR REPLACE FUNCTION get_delivery_performance_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT status AS "_id", COUNT(*) AS count
    FROM orders
    WHERE delivery_date >= NOW() - INTERVAL '7 days'
      AND status IN ('delivered', 'cancelled', 'failed')
    GROUP BY status
  ) t;
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Subscription trends
CREATE OR REPLACE FUNCTION get_subscription_trends()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT
      plan_type::TEXT AS "_id",
      COUNT(*) AS count,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active
    FROM subscriptions
    GROUP BY plan_type
  ) t;
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ANALYTICS FUNCTIONS
-- ============================================

-- Revenue report (by period)
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
      SUM(amount) AS revenue,
      COUNT(*) AS count,
      SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) AS refunds
    FROM payments
    WHERE status = 'captured'
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
    GROUP BY TO_CHAR(created_at, date_format)
    ORDER BY "_id"
  ) t;
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Order analytics
CREATE OR REPLACE FUNCTION get_order_analytics(p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  by_status JSON;
  by_slot JSON;
  by_zone JSON;
BEGIN
  -- By status
  SELECT json_agg(row_to_json(t)) INTO by_status FROM (
    SELECT status::TEXT AS "_id", COUNT(*) AS count
    FROM orders
    WHERE (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
    GROUP BY status
  ) t;

  -- By slot
  SELECT json_agg(row_to_json(t)) INTO by_slot FROM (
    SELECT delivery_slot::TEXT AS "_id", COUNT(*) AS count
    FROM orders
    WHERE (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
    GROUP BY delivery_slot
  ) t;

  -- By zone
  SELECT json_agg(row_to_json(t)) INTO by_zone FROM (
    SELECT o.zone AS "_id", ARRAY_AGG(DISTINCT r.name) AS "zoneName", COUNT(*) AS count
    FROM orders o
    LEFT JOIN routes r ON o.zone = r.id
    WHERE o.zone IS NOT NULL
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    GROUP BY o.zone
  ) t;

  RETURN json_build_object(
    'byStatus', COALESCE(by_status, '[]'::JSON),
    'bySlot', COALESCE(by_slot, '[]'::JSON),
    'byZone', COALESCE(by_zone, '[]'::JSON)
  );
END;
$$ LANGUAGE plpgsql;

-- Subscription analytics
CREATE OR REPLACE FUNCTION get_subscription_analytics()
RETURNS JSON AS $$
DECLARE
  by_plan JSON;
  by_slot JSON;
  by_status JSON;
  churn_rate NUMERIC;
  total_count BIGINT;
  cancelled_count BIGINT;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO by_plan FROM (
    SELECT plan_type::TEXT AS "_id", COUNT(*) AS count FROM subscriptions GROUP BY plan_type
  ) t;

  SELECT json_agg(row_to_json(t)) INTO by_slot FROM (
    SELECT delivery_slot::TEXT AS "_id", COUNT(*) AS count FROM subscriptions GROUP BY delivery_slot
  ) t;

  SELECT json_agg(row_to_json(t)) INTO by_status FROM (
    SELECT status::TEXT AS "_id", COUNT(*) AS count FROM subscriptions GROUP BY status
  ) t;

  SELECT COUNT(*), SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)
  INTO total_count, cancelled_count FROM subscriptions;

  IF total_count > 0 THEN
    churn_rate := cancelled_count::NUMERIC / total_count::NUMERIC;
  ELSE
    churn_rate := 0;
  END IF;

  RETURN json_build_object(
    'byPlan', COALESCE(by_plan, '[]'::JSON),
    'bySlot', COALESCE(by_slot, '[]'::JSON),
    'byStatus', COALESCE(by_status, '[]'::JSON),
    'churnRate', churn_rate
  );
END;
$$ LANGUAGE plpgsql;

-- Customer analytics
CREATE OR REPLACE FUNCTION get_customer_analytics()
RETURNS JSON AS $$
DECLARE
  by_status JSON;
  by_zone JSON;
  top_customers JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO by_status FROM (
    SELECT status::TEXT AS "_id", COUNT(*) AS count FROM customers GROUP BY status
  ) t;

  SELECT json_agg(row_to_json(t)) INTO by_zone FROM (
    SELECT zone AS "_id", COUNT(*) AS count FROM customers WHERE zone IS NOT NULL GROUP BY zone
  ) t;

  SELECT json_agg(row_to_json(t)) INTO top_customers FROM (
    SELECT id AS "_id", customer_id, name, total_orders, total_spent, status::TEXT
    FROM customers
    WHERE deleted_at IS NULL
    ORDER BY total_spent DESC
    LIMIT 10
  ) t;

  RETURN json_build_object(
    'byStatus', COALESCE(by_status, '[]'::JSON),
    'byZone', COALESCE(by_zone, '[]'::JSON),
    'topCustomers', COALESCE(top_customers, '[]'::JSON)
  );
END;
$$ LANGUAGE plpgsql;

-- Revenue summary by type
CREATE OR REPLACE FUNCTION get_revenue_summary(p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT type::TEXT AS "_id", SUM(amount) AS total, COUNT(*) AS count
    FROM payments
    WHERE status = 'captured'
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
    GROUP BY type
  ) t;
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;
