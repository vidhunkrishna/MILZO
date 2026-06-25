const supabase = require('../config/supabase');

const TABLE = 'vendors';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Vendor = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    return addIdAlias(data);
  },

  async create(body) {
    const record = {
      vendor_name: body.vendorName,
      owner_name: body.ownerName,
      email: body.email?.toLowerCase(),
      phone: body.phone,
      alternate_phone: body.alternatePhone,
      address: body.address || {},
      kyc: body.kyc || {},
      gst: body.gst || {},
      bank_details: body.bankDetails || {},
      status: body.status || 'pending',
      commission_rate: body.commissionRate || 0,
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async update(id, body) {
    const updates = {};
    if (body.vendorName !== undefined) updates.vendor_name = body.vendorName;
    if (body.ownerName !== undefined) updates.owner_name = body.ownerName;
    if (body.email !== undefined) updates.email = body.email?.toLowerCase();
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.alternatePhone !== undefined) updates.alternate_phone = body.alternatePhone;
    if (body.address !== undefined) updates.address = body.address;
    if (body.kyc !== undefined) updates.kyc = body.kyc;
    if (body.gst !== undefined) updates.gst = body.gst;
    if (body.bankDetails !== undefined) updates.bank_details = body.bankDetails;
    if (body.status !== undefined) updates.status = body.status;
    if (body.rating !== undefined) updates.rating = body.rating;
    if (body.totalRatings !== undefined) updates.total_ratings = body.totalRatings;
    if (body.products !== undefined) updates.products = body.products;
    if (body.zones !== undefined) updates.zones = body.zones;
    if (body.commissionRate !== undefined) updates.commission_rate = body.commissionRate;
    if (body.totalOrders !== undefined) updates.total_orders = body.totalOrders;
    if (body.totalPayout !== undefined) updates.total_payout = body.totalPayout;
    if (body.pendingPayout !== undefined) updates.pending_payout = body.pendingPayout;
    if (body.deletedAt !== undefined) updates.deleted_at = body.deletedAt;

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).is('deleted_at', null).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async verifyKYC(id, userId) {
    const vendor = await this.findById(id);
    if (!vendor) return null;
    const kyc = { ...vendor.kyc, verified: true, verifiedAt: new Date().toISOString(), verifiedBy: userId };
    const { data, error } = await supabase.from(TABLE).update({ kyc }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async softDelete(id) {
    return this.update(id, { deletedAt: new Date().toISOString() });
  },

  async findAllForReport() {
    const { data, error } = await supabase.from(TABLE)
      .select('id, vendor_id, vendor_name, rating, total_ratings, total_orders, total_payout, pending_payout, status')
      .is('deleted_at', null)
      .order('total_orders', { ascending: false });
    if (error) throw new Error(error.message);
    return addIdAliasArray(data);
  },
};

module.exports = Vendor;
