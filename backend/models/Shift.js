const supabase = require('../config/supabase');

const TABLE = 'shifts';
const AGENTS_TABLE = 'shift_agents';
const ATTENDANCE_TABLE = 'shift_attendance';
const LEAVE_TABLE = 'shift_leave_requests';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Shift = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    const [agentsRes, attendanceRes, leaveRes] = await Promise.all([
      supabase.from(AGENTS_TABLE).select('*').eq('shift_id', id),
      supabase.from(ATTENDANCE_TABLE).select('*').eq('shift_id', id),
      supabase.from(LEAVE_TABLE).select('*').eq('shift_id', id),
    ]);
    const shift = addIdAlias(data);
    shift.assignedAgents = addIdAliasArray(agentsRes.data);
    shift.attendance = addIdAliasArray(attendanceRes.data);
    shift.leaveRequests = addIdAliasArray(leaveRes.data);
    return shift;
  },

  async create(body) {
    const record = {
      name: body.name,
      type: body.type,
      start_time: body.startTime,
      end_time: body.endTime,
      date: body.date,
      routes: body.routes || [],
      status: body.status || 'scheduled',
      notes: body.notes,
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);

    // Insert assigned agents if provided
    if (body.assignedAgents && body.assignedAgents.length > 0) {
      const agents = body.assignedAgents.map(a => ({
        shift_id: data.id,
        agent: a.agent || a,
        status: a.status || 'assigned',
      }));
      await supabase.from(AGENTS_TABLE).insert(agents);
    }

    return addIdAlias(data);
  },

  async update(id, body) {
    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.type !== undefined) updates.type = body.type;
    if (body.startTime !== undefined) updates.start_time = body.startTime;
    if (body.endTime !== undefined) updates.end_time = body.endTime;
    if (body.date !== undefined) updates.date = body.date;
    if (body.routes !== undefined) updates.routes = body.routes;
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.deletedAt !== undefined) updates.deleted_at = body.deletedAt;

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).is('deleted_at', null).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async markAttendance(shiftId, entry) {
    // Check if attendance exists for this agent
    const { data: existing } = await supabase.from(ATTENDANCE_TABLE)
      .select('id').eq('shift_id', shiftId).eq('agent', entry.agentId).limit(1);

    if (existing && existing.length > 0) {
      await supabase.from(ATTENDANCE_TABLE).update({
        present: entry.present,
        check_in: entry.checkIn,
        check_out: entry.checkOut,
        notes: entry.notes,
      }).eq('id', existing[0].id);
    } else {
      await supabase.from(ATTENDANCE_TABLE).insert({
        shift_id: shiftId,
        agent: entry.agentId,
        present: entry.present,
        check_in: entry.checkIn,
        check_out: entry.checkOut,
        notes: entry.notes,
      });
    }
  },

  async handleLeaveRequest(shiftId, agentId, leaveStatus, reviewedBy) {
    const { data: leaves } = await supabase.from(LEAVE_TABLE)
      .select('id').eq('shift_id', shiftId).eq('agent', agentId).limit(1);
    if (!leaves || leaves.length === 0) return null;
    await supabase.from(LEAVE_TABLE).update({ status: leaveStatus, reviewed_by: reviewedBy }).eq('id', leaves[0].id);
    return true;
  },

  async softDelete(id) {
    return this.update(id, { deletedAt: new Date().toISOString() });
  },
};

module.exports = Shift;
