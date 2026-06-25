const supabase = require('../config/supabase');

const TABLE = 'payments';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Payment = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    return addIdAlias(data);
  },

  async create(body) {
    const record = {
      razorpay_order_id: body.razorpayOrderId,
      razorpay_payment_id: body.razorpayPaymentId,
      razorpay_signature: body.razorpaySignature,
      customer: body.customer,
      order: body.order,
      subscription: body.subscription,
      amount: body.amount,
      currency: body.currency || 'INR',
      method: body.method,
      status: body.status || 'pending',
      type: body.type,
      vendor: body.vendor,
      agent: body.agent,
      notes: body.notes,
      failure_reason: body.failureReason,
      metadata: body.metadata,
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async update(id, body) {
    const updates = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.razorpayPaymentId !== undefined) updates.razorpay_payment_id = body.razorpayPaymentId;
    if (body.razorpaySignature !== undefined) updates.razorpay_signature = body.razorpaySignature;
    if (body.refund !== undefined) updates.refund = body.refund;
    if (body.invoice !== undefined) updates.invoice = body.invoice;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.failureReason !== undefined) updates.failure_reason = body.failureReason;
    if (body.deletedAt !== undefined) updates.deleted_at = body.deletedAt;

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },
};

module.exports = Payment;
