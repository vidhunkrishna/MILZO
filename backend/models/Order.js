const supabase = require('../config/supabase');

const TABLE = 'orders';
const ITEMS_TABLE = 'order_items';
const TIMELINE_TABLE = 'order_timeline';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const parsePaymentField = (row) => {
  if (!row) return null;
  let payment = {
    method: 'Unknown',
    status: 'Unknown',
    transactionId: 'N/A',
    paidAt: null
  };

  const txId = row.transaction_id;
  if (txId && txId.trim().startsWith('{') && txId.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(txId);
      payment.method = parsed.method || 'Unknown';
      payment.status = parsed.status || 'Unknown';
      payment.transactionId = parsed.transactionId || 'N/A';
      payment.paidAt = parsed.paidAt || null;
    } catch (e) {
      // If parsing failed, keep defaults
    }
  }
  return payment;
};

const Order = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    // Fetch items, timeline, and agent details
    const [itemsRes, timelineRes] = await Promise.all([
      supabase.from(ITEMS_TABLE).select('*, product_details:products(name)').eq('order_id', id),
      supabase.from(TIMELINE_TABLE).select('*').eq('order_id', id).order('timestamp', { ascending: true }),
    ]);

    const order = addIdAlias(data);
    order.items = (itemsRes.data || []).map(item => ({
      ...item,
      _id: item.id,
      product_name: item.product_details?.name || "Unknown Product",
    }));
    order.timeline = addIdAliasArray(timelineRes.data);

    if (order.delivery_agent) {
      const { data: agent } = await supabase
        .from('delivery_agents')
        .select('name, phone')
        .eq('id', order.delivery_agent)
        .single();
      order.delivery_agent_details = agent || null;
    } else {
      order.delivery_agent_details = null;
    }

    // Build pricing object for backward compat
    order.pricing = {
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryCharge: order.delivery_charge,
      discount: order.discount,
      total: order.total,
    };

    // Parse transaction_id column to get payment details (prevents schema errors)
    order.payment = parsePaymentField(data);
    
    // Maintain backward compatibility for raw transaction_id attribute
    order.transaction_id = order.payment.transactionId;

    return order;
  },

  async create(body) {
    // Set payment fields and defaults
    const method = body.payment?.method || 'cod';
    let status = body.payment?.status;
    let transactionId = body.payment?.transactionId;
    let paidAt = body.payment?.paidAt;

    if (method === 'cod') {
      if (!status) status = 'pending';
      if (!transactionId) transactionId = 'N/A';
    } else if (method === 'wallet') {
      if (!status) status = 'paid';
      if (!transactionId) transactionId = 'N/A';
      if (!paidAt) paidAt = new Date().toISOString();
    } else if (method === 'razorpay') {
      if (!status) status = 'captured';
      if (!transactionId) transactionId = 'N/A';
      if (!paidAt) paidAt = new Date().toISOString();
    }

    const payment = {
      method,
      status,
      transactionId,
      paidAt,
    };

    const record = {
      customer: body.customer,
      vendor: body.vendor,
      delivery_agent: body.deliveryAgent,
      delivery_slot: body.deliverySlot,
      delivery_date: body.deliveryDate,
      delivery_address: body.deliveryAddress || {},
      zone: body.zone,
      status: body.status || 'placed',
      subtotal: body.pricing?.subtotal || 0,
      tax: body.pricing?.tax || 0,
      delivery_charge: body.pricing?.deliveryCharge || 0,
      discount: body.pricing?.discount || 0,
      total: body.pricing?.total || 0,
      payment_method: payment.method === 'cod' ? 'cod' : payment.method === 'wallet' ? 'wallet' : 'online',
      payment_status: payment.status === 'paid' || payment.status === 'captured' ? 'captured' : payment.status === 'failed' ? 'failed' : 'pending',
      transaction_id: JSON.stringify(payment), // Store entire payment payload in the transaction_id column
      subscription: body.subscription,
      notes: body.notes,
      is_subscription_order: body.isSubscriptionOrder || false,
    };

    const { data: order, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);

    // Insert items
    if (body.items && body.items.length > 0) {
      const items = body.items.map(item => ({
        order_id: order.id,
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      }));
      await supabase.from(ITEMS_TABLE).insert(items);
    }

    // Insert initial timeline entry
    if (body.timeline && body.timeline.length > 0) {
      const entries = body.timeline.map(t => ({
        order_id: order.id,
        status: t.status,
        timestamp: t.timestamp || new Date().toISOString(),
        note: t.note,
        updated_by: t.updatedBy,
      }));
      await supabase.from(TIMELINE_TABLE).insert(entries);
    }

    return addIdAlias(order);
  },

  async update(id, body) {
    const updates = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.vendor !== undefined) updates.vendor = body.vendor;
    if (body.deliveryAgent !== undefined) updates.delivery_agent = body.deliveryAgent;
    if (body.delivery_agent !== undefined) updates.delivery_agent = body.delivery_agent;
    if (body.deliverySlot !== undefined) updates.delivery_slot = body.deliverySlot;
    if (body.deliveryDate !== undefined) updates.delivery_date = body.deliveryDate;
    if (body.deliveryAddress !== undefined) updates.delivery_address = body.deliveryAddress;
    if (body.zone !== undefined) updates.zone = body.zone;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.cancelReason !== undefined) updates.cancel_reason = body.cancelReason;
    if (body.cancel_reason !== undefined) updates.cancel_reason = body.cancel_reason;
    if (body.rating !== undefined) updates.rating = body.rating;
    if (body.deletedAt !== undefined) updates.deleted_at = body.deletedAt;
    if (body.payment_method !== undefined) updates.payment_method = body.payment_method;
    if (body.payment_status !== undefined) updates.payment_status = body.payment_status;
    if (body.transaction_id !== undefined) updates.transaction_id = body.transaction_id;

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).is('deleted_at', null).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async addTimelineEntry(orderId, entry) {
    const { error } = await supabase.from(TIMELINE_TABLE).insert({
      order_id: orderId,
      status: entry.status,
      timestamp: entry.timestamp || new Date().toISOString(),
      note: entry.note,
      updated_by: entry.updatedBy,
    });
    if (error) throw new Error(error.message);
  },

  async softDelete(id) {
    return this.update(id, { deletedAt: new Date().toISOString() });
  },

  async getTimeline(id) {
    const { data: order } = await supabase.from(TABLE).select('id, order_id, status').eq('id', id).is('deleted_at', null).single();
    if (!order) return null;
    const { data: timeline } = await supabase.from(TIMELINE_TABLE).select('*').eq('order_id', id).order('timestamp', { ascending: true });
    return addIdAlias({ ...order, timeline: addIdAliasArray(timeline) });
  },
};

module.exports = Order;
