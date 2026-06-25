-- ============================================
-- MILZO - Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM (
  'superAdmin', 'operationsManager', 'financeManager', 'deliveryManager', 'customerSupport'
);

CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'suspended', 'blocked');
CREATE TYPE delivery_slot AS ENUM ('morning', 'evening');
CREATE TYPE delivery_slot_pref AS ENUM ('morning', 'evening', 'both');

CREATE TYPE order_status AS ENUM (
  'placed', 'confirmed', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'cancelled', 'failed'
);

CREATE TYPE payment_method AS ENUM ('upi', 'card', 'netbanking', 'wallet', 'cod', 'subscription_credit');
CREATE TYPE payment_status AS ENUM ('pending', 'captured', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_type AS ENUM ('order_payment', 'subscription_payment', 'vendor_payout', 'agent_incentive', 'refund');
CREATE TYPE payment_intent AS ENUM ('online', 'wallet', 'cod', 'subscription');

CREATE TYPE product_category AS ENUM (
  'cow_milk', 'buffalo_milk', 'a2_milk', 'toned_milk', 'full_cream', 'skimmed', 'flavored', 'other'
);
CREATE TYPE product_unit AS ENUM ('litre', 'ml', 'kg', 'g', 'piece');

CREATE TYPE vendor_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

CREATE TYPE subscription_plan AS ENUM ('daily', 'weekly', 'monthly', 'custom');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired', 'pending');
CREATE TYPE billing_cycle AS ENUM ('prepaid', 'postpaid');

CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'on_leave', 'suspended');
CREATE TYPE vehicle_type AS ENUM ('bicycle', 'motorcycle', 'scooter', 'three_wheeler');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

CREATE TYPE shift_type AS ENUM ('morning', 'evening', 'custom');
CREATE TYPE shift_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE shift_agent_status AS ENUM ('assigned', 'confirmed', 'on_leave', 'swapped');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'converted');

CREATE TYPE feedback_type AS ENUM ('complaint', 'review', 'suggestion', 'query');
CREATE TYPE feedback_category AS ENUM ('delivery', 'product_quality', 'service', 'billing', 'agent_behavior', 'app_issue', 'other');
CREATE TYPE feedback_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE feedback_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'escalated');

CREATE TYPE notification_type AS ENUM (
  'new_order', 'failed_payment', 'complaint', 'vendor_issue', 'delivery_delay', 'system', 'info', 'warning', 'success'
);
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');

CREATE TYPE wallet_tx_type AS ENUM ('credit', 'debit');
CREATE TYPE refund_status AS ENUM ('pending', 'processed', 'failed');
CREATE TYPE error_level AS ENUM ('error', 'warn', 'critical');
CREATE TYPE audit_status AS ENUM ('success', 'failure');
CREATE TYPE settings_category AS ENUM ('delivery', 'business', 'payment', 'notification', 'email', 'sms', 'tax', 'system');

-- ============================================
-- SEQUENCES FOR AUTO-GENERATED IDs
-- ============================================

CREATE SEQUENCE customer_seq START 1;
CREATE SEQUENCE vendor_seq START 1;
CREATE SEQUENCE order_seq START 1;
CREATE SEQUENCE subscription_seq START 1;
CREATE SEQUENCE agent_seq START 1;
CREATE SEQUENCE shift_seq START 1;
CREATE SEQUENCE booking_seq START 1;
CREATE SEQUENCE payment_seq START 1;
CREATE SEQUENCE feedback_seq START 1;
CREATE SEQUENCE route_seq START 1;

-- ============================================
-- TABLES
-- ============================================

-- 1. USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role user_role DEFAULT 'customerSupport',
  phone VARCHAR(20),
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  reset_password_token TEXT,
  reset_password_expire TIMESTAMPTZ,
  refresh_token TEXT,
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- 2. ROUTES (zones)
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id VARCHAR(20) UNIQUE,
  name VARCHAR(255) NOT NULL,
  zone VARCHAR(255) NOT NULL,
  city VARCHAR(255),
  pincodes TEXT[],
  description TEXT,
  estimated_time INTEGER,
  distance_km NUMERIC,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routes_zone ON routes(zone);
CREATE INDEX idx_routes_is_active ON routes(is_active);

-- Route waypoints (child table)
CREATE TABLE route_waypoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  waypoint_order INTEGER,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC
);

-- 3. CUSTOMERS
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id VARCHAR(20) UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL UNIQUE,
  alternate_phone VARCHAR(20),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  landmark TEXT,
  lat NUMERIC,
  lng NUMERIC,
  zone UUID REFERENCES routes(id),
  status customer_status DEFAULT 'active',
  subscription_plan UUID,
  wallet_balance NUMERIC DEFAULT 0,
  delivery_slot_pref delivery_slot_pref DEFAULT 'morning',
  milk_type VARCHAR(100),
  quantity NUMERIC DEFAULT 1,
  notes TEXT,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  last_order_date TIMESTAMPTZ,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_zone ON customers(zone);
CREATE INDEX idx_customers_customer_id ON customers(customer_id);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);

-- Wallet transactions (child table)
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type wallet_tx_type NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VENDORS
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id VARCHAR(20) UNIQUE,
  vendor_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL UNIQUE,
  alternate_phone VARCHAR(20),
  address JSONB DEFAULT '{}',
  kyc JSONB DEFAULT '{}',
  gst JSONB DEFAULT '{}',
  bank_details JSONB DEFAULT '{}',
  status vendor_status DEFAULT 'pending',
  rating NUMERIC DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  products UUID[],
  zones UUID[],
  commission_rate NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_payout NUMERIC DEFAULT 0,
  pending_payout NUMERIC DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_phone ON vendors(phone);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_vendor_id ON vendors(vendor_id);

-- 5. PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  category product_category NOT NULL,
  unit product_unit DEFAULT 'litre',
  unit_size NUMERIC NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  mrp NUMERIC CHECK (mrp >= 0),
  cost_price NUMERIC CHECK (cost_price >= 0),
  vendor UUID REFERENCES vendors(id),
  stock JSONB DEFAULT '{"available": 0, "reserved": 0, "minStock": 10}',
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  tax_rate NUMERIC DEFAULT 0,
  available_slots JSONB DEFAULT '{"morning": true, "evening": true}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_vendor ON products(vendor);

-- 6. DELIVERY AGENTS
CREATE TABLE delivery_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(20) UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  date_of_birth DATE,
  gender gender_type,
  address JSONB DEFAULT '{}',
  documents JSONB DEFAULT '{}',
  vehicle_type vehicle_type,
  vehicle_number VARCHAR(50),
  assigned_routes UUID[],
  assigned_zones UUID[],
  current_shift UUID,
  status agent_status DEFAULT 'active',
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  performance JSONB DEFAULT '{"totalDeliveries": 0, "onTimeDeliveries": 0, "failedDeliveries": 0, "totalComplaints": 0, "rating": 0}',
  bank_details JSONB DEFAULT '{}',
  current_location JSONB,
  joining_date TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_phone ON delivery_agents(phone);
CREATE INDEX idx_agents_status ON delivery_agents(status);
CREATE INDEX idx_agents_agent_id ON delivery_agents(agent_id);

-- Route-Agent assigned relation table
CREATE TABLE route_assigned_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
  UNIQUE(route_id, agent_id)
);

-- 7. SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id VARCHAR(20) UNIQUE,
  customer UUID NOT NULL REFERENCES customers(id),
  product UUID NOT NULL REFERENCES products(id),
  vendor UUID REFERENCES vendors(id),
  plan_type subscription_plan NOT NULL,
  delivery_slot delivery_slot_pref NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  price_per_unit NUMERIC NOT NULL,
  total_amount NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE,
  next_delivery_date DATE,
  status subscription_status DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT true,
  billing_cycle billing_cycle DEFAULT 'prepaid',
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  delivery_days JSONB DEFAULT '{"monday":true,"tuesday":true,"wednesday":true,"thursday":true,"friday":true,"saturday":true,"sunday":false}',
  zone UUID REFERENCES routes(id),
  total_deliveries INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX idx_subscriptions_next_delivery ON subscriptions(next_delivery_date);

-- Add FK now that subscriptions exists
ALTER TABLE customers ADD CONSTRAINT fk_customer_subscription FOREIGN KEY (subscription_plan) REFERENCES subscriptions(id);

-- Pause history (child table)
CREATE TABLE pause_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  reason TEXT,
  paused_by UUID REFERENCES users(id)
);

-- 8. ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(30) UNIQUE,
  customer UUID NOT NULL REFERENCES customers(id),
  vendor UUID REFERENCES vendors(id),
  delivery_agent UUID REFERENCES delivery_agents(id),
  delivery_slot delivery_slot NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_address JSONB DEFAULT '{}',
  zone UUID REFERENCES routes(id),
  status order_status DEFAULT 'placed',
  subtotal NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  delivery_charge NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method payment_intent,
  payment_status payment_status DEFAULT 'pending',
  transaction_id TEXT,
  subscription UUID REFERENCES subscriptions(id),
  notes TEXT,
  cancel_reason TEXT,
  is_subscription_order BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer);
CREATE INDEX idx_orders_vendor ON orders(vendor);
CREATE INDEX idx_orders_delivery_agent ON orders(delivery_agent);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_delivery_slot ON orders(delivery_slot);
CREATE INDEX idx_orders_zone ON orders(zone);
CREATE INDEX idx_orders_order_id ON orders(order_id);

-- Order items (child table)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  price NUMERIC NOT NULL,
  total NUMERIC
);

-- Order timeline (child table)
CREATE TABLE order_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  updated_by UUID REFERENCES users(id)
);

-- 9. SHIFTS
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id VARCHAR(20) UNIQUE,
  name VARCHAR(255) NOT NULL,
  type shift_type NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  routes UUID[],
  status shift_status DEFAULT 'scheduled',
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_type ON shifts(type);
CREATE INDEX idx_shifts_status ON shifts(status);

-- Shift assigned agents (child table)
CREATE TABLE shift_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  agent UUID NOT NULL REFERENCES delivery_agents(id),
  status shift_agent_status DEFAULT 'assigned',
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ
);

-- Shift attendance (child table)
CREATE TABLE shift_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  agent UUID NOT NULL REFERENCES delivery_agents(id),
  present BOOLEAN,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  notes TEXT
);

-- Shift leave requests (child table)
CREATE TABLE shift_leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  agent UUID NOT NULL REFERENCES delivery_agents(id),
  reason TEXT,
  status leave_status DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id)
);

-- Shift swap requests (child table)
CREATE TABLE shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  requesting_agent UUID NOT NULL REFERENCES delivery_agents(id),
  target_agent UUID NOT NULL REFERENCES delivery_agents(id),
  status leave_status DEFAULT 'pending',
  reason TEXT
);

-- 10. BOOKINGS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id VARCHAR(20) UNIQUE,
  customer UUID NOT NULL REFERENCES customers(id),
  product UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  delivery_date DATE NOT NULL,
  delivery_slot delivery_slot NOT NULL,
  delivery_address JSONB DEFAULT '{}',
  price NUMERIC NOT NULL,
  total NUMERIC,
  status booking_status DEFAULT 'pending',
  converted_to_order UUID REFERENCES orders(id),
  notes TEXT,
  cancel_reason TEXT,
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_customer ON bookings(customer);
CREATE INDEX idx_bookings_delivery_date ON bookings(delivery_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- 11. PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id VARCHAR(30) UNIQUE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  customer UUID REFERENCES customers(id),
  "order" UUID REFERENCES orders(id),
  subscription UUID REFERENCES subscriptions(id),
  amount NUMERIC NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  method payment_method,
  status payment_status DEFAULT 'pending',
  type payment_type NOT NULL,
  refund JSONB,
  invoice JSONB,
  vendor UUID REFERENCES vendors(id),
  agent UUID REFERENCES delivery_agents(id),
  notes TEXT,
  failure_reason TEXT,
  metadata JSONB,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_customer ON payments(customer);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(type);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);

-- 12. FEEDBACK
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id VARCHAR(30) UNIQUE,
  customer UUID NOT NULL REFERENCES customers(id),
  "order" UUID REFERENCES orders(id),
  type feedback_type NOT NULL,
  category feedback_category NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  attachments TEXT[],
  priority feedback_priority DEFAULT 'medium',
  status feedback_status DEFAULT 'open',
  resolution JSONB,
  escalation JSONB,
  assigned_to UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_customer ON feedback(customer);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_category ON feedback(category);
CREATE INDEX idx_feedback_priority ON feedback(priority);
CREATE INDEX idx_feedback_assigned_to ON feedback(assigned_to);

-- Feedback comments (child table)
CREATE TABLE feedback_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  author UUID REFERENCES users(id),
  text TEXT,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  is_global BOOLEAN DEFAULT false,
  channels JSONB DEFAULT '{"inApp": true, "email": false, "sms": false}',
  related_entity_type VARCHAR(100),
  related_entity_id UUID,
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_is_global ON notifications(is_global);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Notification recipients (child table)
CREATE TABLE notification_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id)
);

-- Notification reads (child table)
CREATE TABLE notification_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- 14. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user" UUID REFERENCES users(id),
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  description TEXT,
  previous_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  status audit_status DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs("user");
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 15. ERROR LOGS
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level error_level DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  module VARCHAR(100),
  endpoint TEXT,
  method VARCHAR(10),
  ip_address VARCHAR(50),
  user_id UUID REFERENCES users(id),
  request_body JSONB,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_level ON error_logs(level);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);

-- 16. SETTINGS
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB,
  category settings_category,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);

-- ============================================
-- AUTO-ID TRIGGER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NULL THEN
    NEW.customer_id := 'CUST' || LPAD(nextval('customer_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_customer_id BEFORE INSERT ON customers FOR EACH ROW EXECUTE FUNCTION generate_customer_id();

CREATE OR REPLACE FUNCTION generate_vendor_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vendor_id IS NULL THEN
    NEW.vendor_id := 'VND' || LPAD(nextval('vendor_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_vendor_id BEFORE INSERT ON vendors FOR EACH ROW EXECUTE FUNCTION generate_vendor_id();

CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_id IS NULL THEN
    NEW.order_id := 'ORD' || RIGHT(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 6) || LPAD(nextval('order_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_order_id BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_id();

CREATE OR REPLACE FUNCTION generate_subscription_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_id IS NULL THEN
    NEW.subscription_id := 'SUB' || LPAD(nextval('subscription_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_subscription_id BEFORE INSERT ON subscriptions FOR EACH ROW EXECUTE FUNCTION generate_subscription_id();

CREATE OR REPLACE FUNCTION generate_agent_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agent_id IS NULL THEN
    NEW.agent_id := 'AGT' || LPAD(nextval('agent_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_agent_id BEFORE INSERT ON delivery_agents FOR EACH ROW EXECUTE FUNCTION generate_agent_id();

CREATE OR REPLACE FUNCTION generate_shift_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shift_id IS NULL THEN
    NEW.shift_id := 'SHF' || LPAD(nextval('shift_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_shift_id BEFORE INSERT ON shifts FOR EACH ROW EXECUTE FUNCTION generate_shift_id();

CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_id IS NULL THEN
    NEW.booking_id := 'BKG' || LPAD(nextval('booking_seq')::TEXT, 5, '0');
  END IF;
  NEW.total := NEW.quantity * NEW.price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_booking_id BEFORE INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION generate_booking_id();

CREATE OR REPLACE FUNCTION generate_payment_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_id IS NULL THEN
    NEW.payment_id := 'PAY' || RIGHT(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 8) || LPAD(nextval('payment_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_payment_id BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION generate_payment_id();

CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_id IS NULL THEN
    NEW.ticket_id := 'TKT' || RIGHT(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 6) || LPAD(nextval('feedback_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_ticket_id BEFORE INSERT ON feedback FOR EACH ROW EXECUTE FUNCTION generate_ticket_id();

CREATE OR REPLACE FUNCTION generate_route_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.route_id IS NULL THEN
    NEW.route_id := 'RTE' || LPAD(nextval('route_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_route_id BEFORE INSERT ON routes FOR EACH ROW EXECUTE FUNCTION generate_route_id();

-- ============================================
-- UPDATED_AT TRIGGER (auto-set on UPDATE)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON delivery_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SLUG GENERATION FOR PRODUCTS
-- ============================================

CREATE OR REPLACE FUNCTION generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name OR OLD IS NULL THEN
    NEW.slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.name, '[^\w\s-]', '', 'g'), '\s+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_slug BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION generate_product_slug();
