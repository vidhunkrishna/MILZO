const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const TABLE = 'users';

/**
 * Add _id alias to maintain backward compatibility with frontend
 */
const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};

const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const User = {
  async findByEmail(email, includePassword = false) {
    let query = supabase.from(TABLE).select('*').eq('email', email.toLowerCase()).is('deleted_at', null).single();
    const { data, error } = await query;
    if (error) return null;
    return addIdAlias(data);
  },

  async findById(id, excludeFields = []) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error) return null;
    const row = addIdAlias(data);
    if (row && excludeFields.length > 0) {
      excludeFields.forEach(f => delete row[f]);
    }
    return row;
  },

  async findByIdSafe(id) {
    return this.findById(id, ['password', 'reset_password_token', 'refresh_token']);
  },

  async create(userData) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    const { data, error } = await supabase.from(TABLE).insert({
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role || 'customerSupport',
      phone: userData.phone,
      avatar: userData.avatar,
      is_active: userData.isActive !== undefined ? userData.isActive : true,
      created_by: userData.createdBy,
    }).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async updateById(id, updates) {
    const mappedUpdates = {};
    if (updates.name !== undefined) mappedUpdates.name = updates.name;
    if (updates.email !== undefined) mappedUpdates.email = updates.email;
    if (updates.phone !== undefined) mappedUpdates.phone = updates.phone;
    if (updates.role !== undefined) mappedUpdates.role = updates.role;
    if (updates.avatar !== undefined) mappedUpdates.avatar = updates.avatar;
    if (updates.isActive !== undefined) mappedUpdates.is_active = updates.isActive;
    if (updates.is_active !== undefined) mappedUpdates.is_active = updates.is_active;
    if (updates.lastLogin !== undefined) mappedUpdates.last_login = updates.lastLogin;
    if (updates.last_login !== undefined) mappedUpdates.last_login = updates.last_login;
    if (updates.refreshToken !== undefined) mappedUpdates.refresh_token = updates.refreshToken;
    if (updates.refresh_token !== undefined) mappedUpdates.refresh_token = updates.refresh_token;
    if (updates.resetPasswordToken !== undefined) mappedUpdates.reset_password_token = updates.resetPasswordToken;
    if (updates.resetPasswordExpire !== undefined) mappedUpdates.reset_password_expire = updates.resetPasswordExpire;
    if (updates.deletedAt !== undefined) mappedUpdates.deleted_at = updates.deletedAt;
    if (updates.deleted_at !== undefined) mappedUpdates.deleted_at = updates.deleted_at;
    if (updates.password !== undefined) {
      const salt = await bcrypt.genSalt(12);
      mappedUpdates.password = await bcrypt.hash(updates.password, salt);
    }

    const { data, error } = await supabase.from(TABLE).update(mappedUpdates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async matchPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  async countByRole(role) {
    const { count, error } = await supabase.from(TABLE).select('*', { count: 'exact', head: true }).eq('role', role);
    if (error) return 0;
    return count;
  },

  async findAll(filter = {}, options = {}) {
    let query = supabase.from(TABLE).select('*', { count: 'exact' }).is('deleted_at', null);
    if (filter.role) query = query.eq('role', filter.role);
    if (filter.isActive !== undefined) query = query.eq('is_active', filter.isActive);

    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder === 'asc' ? true : false;
    query = query.order(sortBy, { ascending: sortOrder });

    if (options.select) {
      query = supabase.from(TABLE).select(options.select, { count: 'exact' }).is('deleted_at', null);
      if (filter.role) query = query.eq('role', filter.role);
      if (filter.isActive !== undefined) query = query.eq('is_active', filter.isActive);
      query = query.range(from, to).order(sortBy, { ascending: sortOrder });
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: addIdAliasArray(data), count };
  },
};

module.exports = User;
