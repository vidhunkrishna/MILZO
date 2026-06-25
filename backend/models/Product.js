const supabase = require('../config/supabase');

const TABLE = 'products';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Product = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    return addIdAlias(data);
  },

  async create(body) {
    const record = {
      name: body.name,
      description: body.description,
      category: body.category?.toLowerCase(),
      unit: body.unit || 'litre',
      unit_size: body.unitSize,
      price: body.price,
      mrp: body.mrp,
      cost_price: body.costPrice,
      vendor: body.vendor,
      stock: body.stock || { available: 0, reserved: 0, minStock: 10 },
      images: body.images || [],
      is_active: body.isActive !== undefined ? body.isActive : true,
      is_featured: body.isFeatured || false,
      tax_rate: body.taxRate || 0,
      available_slots: body.availableSlots || { morning: true, evening: true },
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async update(id, body) {
    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category?.toLowerCase();
    if (body.unit !== undefined) updates.unit = body.unit;
    if (body.unitSize !== undefined) updates.unit_size = body.unitSize;
    if (body.price !== undefined) updates.price = body.price;
    if (body.mrp !== undefined) updates.mrp = body.mrp;
    if (body.costPrice !== undefined) updates.cost_price = body.costPrice;
    if (body.vendor !== undefined) updates.vendor = body.vendor;
    if (body.stock !== undefined) updates.stock = body.stock;
    if (body.images !== undefined) updates.images = body.images;
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.isFeatured !== undefined) updates.is_featured = body.isFeatured;
    if (body.taxRate !== undefined) updates.tax_rate = body.taxRate;
    if (body.availableSlots !== undefined) updates.available_slots = body.availableSlots;
    if (body.deletedAt !== undefined) updates.deleted_at = body.deletedAt;

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).is('deleted_at', null).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async updateStock(id, stockUpdates) {
    const product = await this.findById(id);
    if (!product) return null;
    const stock = product.stock || {};
    if (stockUpdates.available !== undefined) stock.available = stockUpdates.available;
    if (stockUpdates.reserved !== undefined) stock.reserved = stockUpdates.reserved;
    const { data, error } = await supabase.from(TABLE).update({ stock }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async softDelete(id) {
    return this.update(id, { deletedAt: new Date().toISOString() });
  },
};

module.exports = Product;
