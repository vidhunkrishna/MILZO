const supabase = require('../config/supabase');

const TABLE = 'error_logs';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const ErrorLog = {
  async create(entry) {
    const record = {
      level: entry.level || 'error',
      message: entry.message,
      stack: entry.stack,
      module: entry.module,
      endpoint: entry.endpoint,
      method: entry.method,
      ip_address: entry.ipAddress,
      user_id: entry.userId,
      request_body: entry.requestBody,
      metadata: entry.metadata,
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
    if (filter.level) query = query.eq('level', filter.level);
    if (filter.resolved !== undefined) query = query.eq('resolved', filter.resolved);

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: addIdAliasArray(data), count };
  },

  async resolve(id, userId) {
    const { data, error } = await supabase.from(TABLE).update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
    }).eq('id', id).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },
};

module.exports = ErrorLog;
