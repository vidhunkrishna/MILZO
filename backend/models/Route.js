const supabase = require('../config/supabase');

const TABLE = 'routes';
const WAYPOINTS_TABLE = 'route_waypoints';
const ASSIGNED_AGENTS_TABLE = 'route_assigned_agents';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Route = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    const { data: waypoints } = await supabase.from(WAYPOINTS_TABLE).select('*').eq('route_id', id).order('waypoint_order');
    const { data: agents } = await supabase.from(ASSIGNED_AGENTS_TABLE).select('agent_id').eq('route_id', id);
    const route = addIdAlias(data);
    route.waypoints = waypoints || [];
    route.assignedAgents = (agents || []).map(a => a.agent_id);
    return route;
  },

  async findAll() {
    const { data, error } = await supabase.from(TABLE).select('*').is('deleted_at', null);
    if (error) throw new Error(error.message);
    return addIdAliasArray(data);
  },

  async create(body) {
    const record = {
      name: body.name,
      zone: body.zone,
      city: body.city,
      pincodes: body.pincodes || [],
      description: body.description,
      estimated_time: body.estimatedTime,
      distance_km: body.distanceKm,
      is_active: body.isActive !== undefined ? body.isActive : true,
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);

    if (body.waypoints && body.waypoints.length > 0) {
      const waypoints = body.waypoints.map(w => ({
        route_id: data.id,
        waypoint_order: w.order,
        address: w.address,
        lat: w.coordinates?.lat,
        lng: w.coordinates?.lng,
      }));
      await supabase.from(WAYPOINTS_TABLE).insert(waypoints);
    }

    return addIdAlias(data);
  },

  async update(id, body) {
    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.zone !== undefined) updates.zone = body.zone;
    if (body.city !== undefined) updates.city = body.city;
    if (body.pincodes !== undefined) updates.pincodes = body.pincodes;
    if (body.description !== undefined) updates.description = body.description;
    if (body.estimatedTime !== undefined) updates.estimated_time = body.estimatedTime;
    if (body.distanceKm !== undefined) updates.distance_km = body.distanceKm;
    if (body.isActive !== undefined) updates.is_active = body.isActive;
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

module.exports = Route;
