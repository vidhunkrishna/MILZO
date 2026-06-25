const supabase = require('../config/supabase');

const TABLE = 'orders';
const ITEMS_TABLE = 'order_items';
const TIMELINE_TABLE = 'order_timeline';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Order = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    // Fetch items and timeline
    const [itemsRes, timelineRes] = await Promise.all([
      supabase.from(ITEMS_TABLE).select('*').eq('order_id', id),
      supabase.from(TIMELINE_TABLE).select('*').eq('order_id', id).order('timestamp', { ascending: true }),
    ]);
    const order = addIdAlias(data);
    order.items = addIdAliasArray(itemsRes.data);
    order.timeline = addIdAliasArray(timelineRes.data);
    // Build pricing object for backward compat
    order.pricing = {
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryCharge: order.delivery_charge,
      discount: order.discount,
      total: order.total,
    };
    return order;
  },

  async create(body) {
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
      payment_method: body.payment?.method,
      payment_status: body.payment?.status || 'pending',
      transaction_id: body.payment?.transactionId,
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
