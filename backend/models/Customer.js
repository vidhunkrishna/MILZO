const supabase = require('../config/supabase');

const TABLE = 'customers';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Customer = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    return addIdAlias(data);
  },

  async create(body) {
    const record = {
      name: body.name,
      email: body.email?.toLowerCase(),
      phone: body.phone,
      alternate_phone: body.alternatePhone,
      address_line1: body.address?.line1,
      address_line2: body.address?.line2,
      city: body.address?.city,
      state: body.address?.state,
      pincode: body.address?.pincode,
      landmark: body.address?.landmark,
      lat: body.address?.coordinates?.lat,
      lng: body.address?.coordinates?.lng,
      zone: body.zone,
      status: (body.status || 'active').toLowerCase(),
      subscription_plan: body.subscriptionPlan,
      wallet_balance: body.wallet?.balance || 0,
      delivery_slot_pref: (body.preferences?.deliverySlot || 'morning').toLowerCase(),
      milk_type: body.preferences?.milkType,
      quantity: body.preferences?.quantity || 1,
      notes: body.notes,
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async update(id, body) {
    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email?.toLowerCase();
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.alternatePhone !== undefined) updates.alternate_phone = body.alternatePhone;
    if (body.status !== undefined) updates.status = body.status?.toLowerCase();
    if (body.zone !== undefined) updates.zone = body.zone;
    if (body.subscriptionPlan !== undefined) updates.subscription_plan = body.subscriptionPlan;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.wallet_balance !== undefined) updates.wallet_balance = body.wallet_balance;
    if (body.lastOrderDate !== undefined) updates.last_order_date = body.lastOrderDate;
    if (body.last_order_date !== undefined) updates.last_order_date = body.last_order_date;
    if (body.address) {
      if (body.address.line1 !== undefined) updates.address_line1 = body.address.line1;
      if (body.address.line2 !== undefined) updates.address_line2 = body.address.line2;
      if (body.address.city !== undefined) updates.city = body.address.city;
      if (body.address.state !== undefined) updates.state = body.address.state;
      if (body.address.pincode !== undefined) updates.pincode = body.address.pincode;
      if (body.address.landmark !== undefined) updates.landmark = body.address.landmark;
    }
    if (body.preferences) {
      if (body.preferences.deliverySlot) updates.delivery_slot_pref = body.preferences.deliverySlot;
      if (body.preferences.milkType) updates.milk_type = body.preferences.milkType;
      if (body.preferences.quantity) updates.quantity = body.preferences.quantity;
    }
    if (body.deletedAt !== undefined) updates.deleted_at = body.deletedAt;

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).is('deleted_at', null).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async softDelete(id) {
    return this.update(id, { deletedAt: new Date().toISOString() });
  },

  async incrementOrders(id, totalAmount) {
    // Use RPC or manual read/update
    const customer = await this.findById(id);
    if (!customer) return null;
    const { data, error } = await supabase.from(TABLE).update({
      total_orders: (customer.total_orders || 0) + 1,
      total_spent: (customer.total_spent || 0) + totalAmount,
      last_order_date: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async findAllExport() {
    const { data, error } = await supabase.from(TABLE)
      .select('customer_id, name, phone, email, city, status, registration_date, total_orders, total_spent')
      .is('deleted_at', null);
    if (error) throw new Error(error.message);
    return addIdAliasArray(data);
  },
};

module.exports = Customer;
