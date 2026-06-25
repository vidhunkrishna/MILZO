const supabase = require('../config/supabase');

const TABLE = 'audit_logs';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const AuditLog = {
  async create(entry) {
    const record = {
      user: entry.user,
      user_name: entry.userName,
      user_role: entry.userRole,
      action: entry.action,
      module: entry.module,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      description: entry.description,
      previous_value: entry.previousValue,
      new_value: entry.newValue,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      status: entry.status || 'success',
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async findAll(filter = {}, options = {}) {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from(TABLE).select('*', { count: 'exact' });
    if (filter.module) query = query.eq('module', filter.module);
    if (filter.action) query = query.eq('action', filter.action);
    if (filter.user) query = query.eq('user', filter.user);

    const sortBy = options.sortBy || 'created_at';
    const ascending = options.sortOrder === 'asc';
    query = query.order(sortBy, { ascending }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: addIdAliasArray(data), count };
  },
};

module.exports = AuditLog;
