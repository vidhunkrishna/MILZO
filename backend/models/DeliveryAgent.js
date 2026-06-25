const supabase = require('../config/supabase');

const TABLE = 'delivery_agents';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const DeliveryAgent = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    return addIdAlias(data);
  },

  async create(body) {
    const record = {
      name: body.name,
      phone: body.phone,
      email: body.email?.toLowerCase(),
      date_of_birth: body.dateOfBirth,
      gender: body.gender,
      address: body.address || {},
      documents: body.documents || {},
      vehicle_type: body.vehicleType,
      vehicle_number: body.vehicleNumber,
      assigned_routes: body.assignedRoutes || [],
      assigned_zones: body.assignedZones || [],
      status: body.status || 'active',
      bank_details: body.bankDetails || {},
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async update(id, body) {
    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.email !== undefined) updates.email = body.email?.toLowerCase();
    if (body.dateOfBirth !== undefined) updates.date_of_birth = body.dateOfBirth;
    if (body.gender !== undefined) updates.gender = body.gender;
    if (body.address !== undefined) updates.address = body.address;
    if (body.documents !== undefined) updates.documents = body.documents;
    if (body.vehicleType !== undefined) updates.vehicle_type = body.vehicleType;
    if (body.vehicleNumber !== undefined) updates.vehicle_number = body.vehicleNumber;
    if (body.assignedRoutes !== undefined) updates.assigned_routes = body.assignedRoutes;
    if (body.assignedZones !== undefined) updates.assigned_zones = body.assignedZones;
    if (body.currentShift !== undefined) updates.current_shift = body.currentShift;
    if (body.status !== undefined) updates.status = body.status;
    if (body.isVerified !== undefined) updates.is_verified = body.isVerified;
    if (body.verifiedBy !== undefined) updates.verified_by = body.verifiedBy;
    if (body.performance !== undefined) updates.performance = body.performance;
    if (body.bankDetails !== undefined) updates.bank_details = body.bankDetails;
    if (body.currentLocation !== undefined) updates.current_location = body.currentLocation;
    if (body.deletedAt !== undefined) updates.deleted_at = body.deletedAt;

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).is('deleted_at', null).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async softDelete(id) {
    return this.update(id, { deletedAt: new Date().toISOString() });
  },

  async findTopPerformers(limit = 20) {
    const { data, error } = await supabase.from(TABLE)
      .select('id, agent_id, name, performance')
      .is('deleted_at', null)
      .order('performance->totalDeliveries', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return addIdAliasArray(data);
  },
};

module.exports = DeliveryAgent;
