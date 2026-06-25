const supabase = require('../config/supabase');

/**
 * Supabase pagination utility
 * Replaces Mongoose-based pagination
 */
const paginate = async (table, filter = {}, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const sortField = options.sortBy || 'created_at';
  const ascending = options.sortOrder === 'asc';

  // Build the select columns
  const selectCols = options.select || '*';

  // Start query with count
  let query = supabase.from(table).select(selectCols, { count: 'exact' });

  // Apply filters
  Object.entries(filter).forEach(([key, value]) => {
    if (key === '$or') return; // Handle $or separately
    if (key === 'deletedAt' || key === 'deleted_at') {
      if (value === null) query = query.is('deleted_at', null);
      else query = query.eq('deleted_at', value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Handle range filters like { $gte: ..., $lt: ... }
      if (value.$gte !== undefined) query = query.gte(key, value.$gte);
      if (value.$gt !== undefined) query = query.gt(key, value.$gt);
      if (value.$lte !== undefined) query = query.lte(key, value.$lte);
      if (value.$lt !== undefined) query = query.lt(key, value.$lt);
      if (value.$in !== undefined) query = query.in(key, value.$in);
      if (value.$regex !== undefined) query = query.ilike(key, `%${value.$regex}%`);
    } else {
      query = query.eq(key, value);
    }
  });

  // Handle $or for search (convert to Supabase .or())
  if (filter.$or && filter.$or.length > 0) {
    const orConditions = filter.$or.map(condition => {
      const [key, value] = Object.entries(condition)[0];
      if (typeof value === 'object' && value.$regex) {
        return `${key}.ilike.%${value.$regex}%`;
      }
      return `${key}.eq.${value}`;
    });
    query = query.or(orConditions.join(','));
  }

  // Apply sort and range
  query = query.order(sortField, { ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  // Add _id alias for backward compatibility
  const aliasedData = (data || []).map(row => ({ ...row, _id: row.id }));

  return {
    data: aliasedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

module.exports = { paginate };
