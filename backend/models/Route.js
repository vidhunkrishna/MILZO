const supabase = require('../config/supabase');

const TABLE = 'routes';
const WAYPOINTS_TABLE = 'route_waypoints';
const ASSIGNED_AGENTS_TABLE = 'route_assigned_agents';

const addIdAlias = (row) => {
  if (!row) return null;
  // Deserialize extra fields from description
  let startPoint = 'MILZO Hub 1';
  let endPoint = row.zone;
  let stops = 10;
  let agentName = 'Unassigned';
  let status = row.is_active ? 'Active' : 'Inactive';
  let distance = `${row.distance_km || 5} km`;

  try {
    if (row.description && row.description.startsWith('{')) {
      const extra = JSON.parse(row.description);
      if (extra.startPoint) startPoint = extra.startPoint;
      if (extra.endPoint) endPoint = extra.endPoint;
      if (extra.stops) stops = extra.stops;
      if (extra.agentName) agentName = extra.agentName;
      if (extra.status) status = extra.status;
      if (extra.distance) distance = extra.distance;
    }
  } catch (e) {
    // Ignore JSON parsing errors
  }

  return { 
    ...row, 
    _id: row.id,
    startPoint,
    endPoint,
    stops,
    agentName,
    status,
    distance,
  };
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
      zone: body.endPoint || body.zone || body.name, // satisfy NOT NULL constraint
      city: body.startPoint || body.city || 'MILZO Hub 1',
      pincodes: body.pincodes || [],
      // Serialize extra fields into description
      description: JSON.stringify({
        startPoint: body.startPoint || 'MILZO Hub 1',
        endPoint: body.endPoint || '',
        stops: body.stops || 10,
        agentName: body.agentName || 'Unassigned',
        status: body.status || 'Active',
        distance: body.distance || '5 km',
      }),
      estimated_time: body.estimatedTime || 30,
      distance_km: parseFloat(body.distance) || body.distanceKm || 5,
      is_active: body.status === 'Active' || body.isActive || true,
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
    if (body.endPoint !== undefined) updates.zone = body.endPoint;
    if (body.zone !== undefined) updates.zone = body.zone;
    if (body.startPoint !== undefined) updates.city = body.startPoint;
    if (body.city !== undefined) updates.city = body.city;
    if (body.pincodes !== undefined) updates.pincodes = body.pincodes;
    
    // Update description JSON with new body values if they exist
    if (body.startPoint !== undefined || body.endPoint !== undefined || body.stops !== undefined || body.agentName !== undefined || body.status !== undefined || body.distance !== undefined) {
      // Fetch current route to get existing description
      const { data: currentRoute } = await supabase.from(TABLE).select('description').eq('id', id).single();
      let currentExtra = {};
      try {
        if (currentRoute?.description && currentRoute.description.startsWith('{')) {
          currentExtra = JSON.parse(currentRoute.description);
        }
      } catch (e) {}

      updates.description = JSON.stringify({
        startPoint: body.startPoint !== undefined ? body.startPoint : (currentExtra.startPoint || 'MILZO Hub 1'),
        endPoint: body.endPoint !== undefined ? body.endPoint : (currentExtra.endPoint || ''),
        stops: body.stops !== undefined ? body.stops : (currentExtra.stops || 10),
        agentName: body.agentName !== undefined ? body.agentName : (currentExtra.agentName || 'Unassigned'),
        status: body.status !== undefined ? body.status : (currentExtra.status || 'Active'),
        distance: body.distance !== undefined ? body.distance : (currentExtra.distance || '5 km'),
      });
    }

    if (body.estimatedTime !== undefined) updates.estimated_time = body.estimatedTime;
    if (body.distanceKm !== undefined) updates.distance_km = body.distanceKm;
    if (body.distance !== undefined) updates.distance_km = parseFloat(body.distance) || 5;
    if (body.status !== undefined) updates.is_active = body.status === 'Active';
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
