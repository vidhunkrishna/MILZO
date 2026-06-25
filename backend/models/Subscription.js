const supabase = require('../config/supabase');

const TABLE = 'subscriptions';
const PAUSE_TABLE = 'pause_history';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Subscription = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    // Get pause history
    const { data: pauses } = await supabase.from(PAUSE_TABLE).select('*').eq('subscription_id', id).order('paused_at', { ascending: true });
    const sub = addIdAlias(data);
    sub.pauseHistory = addIdAliasArray(pauses);
    return sub;
  },

  async create(body) {
    const record = {
      customer: body.customer,
      product: body.product,
      vendor: body.vendor,
      plan_type: body.planType?.toLowerCase(),
      delivery_slot: body.deliverySlot?.toLowerCase(),
      quantity: body.quantity,
      price_per_unit: body.pricePerUnit,
      total_amount: body.quantity * body.pricePerUnit,
      start_date: body.startDate,
      end_date: body.endDate,
      next_billing_date: body.nextBillingDate,
      next_delivery_date: body.nextDeliveryDate,
      status: (body.status || 'active').toLowerCase(),
      auto_renew: body.autoRenew !== undefined ? body.autoRenew : true,
      billing_cycle: body.billingCycle?.toLowerCase() || 'prepaid',
      delivery_days: body.deliveryDays || { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false },
      zone: body.zone,
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async update(id, body) {
    const updates = {};
    if (body.planType !== undefined) updates.plan_type = body.planType?.toLowerCase();
    if (body.deliverySlot !== undefined) updates.delivery_slot = body.deliverySlot?.toLowerCase();
    if (body.quantity !== undefined) updates.quantity = body.quantity;
    if (body.pricePerUnit !== undefined) updates.price_per_unit = body.pricePerUnit;
    if (body.status !== undefined) updates.status = body.status?.toLowerCase();
    if (body.autoRenew !== undefined) updates.auto_renew = body.autoRenew;
    if (body.billingCycle !== undefined) updates.billing_cycle = body.billingCycle?.toLowerCase();
    if (body.startDate !== undefined) updates.start_date = body.startDate;
    if (body.endDate !== undefined) updates.end_date = body.endDate;
    if (body.nextBillingDate !== undefined) updates.next_billing_date = body.nextBillingDate;
    if (body.nextDeliveryDate !== undefined) updates.next_delivery_date = body.nextDeliveryDate;
    if (body.cancelReason !== undefined) updates.cancel_reason = body.cancelReason;
    if (body.cancelledAt !== undefined) updates.cancelled_at = body.cancelledAt;
    if (body.cancelledBy !== undefined) updates.cancelled_by = body.cancelledBy;
    if (body.deliveryDays !== undefined) updates.delivery_days = body.deliveryDays;
    if (body.zone !== undefined) updates.zone = body.zone;
    if (body.deletedAt !== undefined) updates.deleted_at = body.deletedAt;
    // Recalculate total if quantity or price changed
    if (body.quantity && body.pricePerUnit) {
      updates.total_amount = body.quantity * body.pricePerUnit;
    }

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).is('deleted_at', null).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async addPauseEntry(subscriptionId, entry) {
    const { error } = await supabase.from(PAUSE_TABLE).insert({
      subscription_id: subscriptionId,
      paused_at: entry.pausedAt,
      resumed_at: entry.resumedAt,
      reason: entry.reason,
      paused_by: entry.pausedBy,
    });
    if (error) throw new Error(error.message);
  },

  async updateLastPauseResume(subscriptionId) {
    // Get the last pause entry without a resumed_at
    const { data: pauses } = await supabase.from(PAUSE_TABLE).select('*')
      .eq('subscription_id', subscriptionId).is('resumed_at', null)
      .order('paused_at', { ascending: false }).limit(1);
    if (pauses && pauses.length > 0) {
      await supabase.from(PAUSE_TABLE).update({ resumed_at: new Date().toISOString() }).eq('id', pauses[0].id);
    }
  },

  async softDelete(id) {
    return this.update(id, { deletedAt: new Date().toISOString() });
  },
};

module.exports = Subscription;
