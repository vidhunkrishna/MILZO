const supabase = require('../config/supabase');

const TABLE = 'settings';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Settings = {
  async getByKey(key) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('key', key).single();
    if (error) return null;
    return addIdAlias(data);
  },

  async findAll(filter = {}) {
    let query = supabase.from(TABLE).select('*');
    if (filter.category) query = query.eq('category', filter.category);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return addIdAliasArray(data);
  },

  async upsert(key, value, updatedBy, category = null) {
    const record = { key, value, updated_by: updatedBy };
    if (category) record.category = category;

    const { data, error } = await supabase.from(TABLE).upsert(record, { onConflict: 'key' }).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },
};

module.exports = Settings;
