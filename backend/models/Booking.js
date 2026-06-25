const supabase = require('../config/supabase');

const TABLE = 'bookings';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Booking = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    return addIdAlias(data);
  },

  async create(body) {
    const record = {
      customer: body.customer,
      product: body.product,
      quantity: body.quantity,
      delivery_date: body.deliveryDate,
      delivery_slot: body.deliverySlot?.toLowerCase(),
      delivery_address: body.deliveryAddress || {},
      price: body.price,
      total: body.quantity * body.price,
      status: (body.status || 'pending').toLowerCase(),
      notes: body.notes,
      created_by: body.createdBy,
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async update(id, body) {
    const updates = {};
    if (body.quantity !== undefined) updates.quantity = body.quantity;
    if (body.deliveryDate !== undefined) updates.delivery_date = body.deliveryDate;
    if (body.deliverySlot !== undefined) updates.delivery_slot = body.deliverySlot?.toLowerCase();
    if (body.deliveryAddress !== undefined) updates.delivery_address = body.deliveryAddress;
    if (body.price !== undefined) updates.price = body.price;
    if (body.status !== undefined) updates.status = body.status?.toLowerCase();
    if (body.cancelReason !== undefined) updates.cancel_reason = body.cancelReason;
    if (body.convertedToOrder !== undefined) updates.converted_to_order = body.convertedToOrder;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.deletedAt !== undefined) updates.deleted_at = body.deletedAt;

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).is('deleted_at', null).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async softDelete(id) {
    return this.update(id, { deletedAt: new Date().toISOString() });
  },
};

module.exports = Booking;
