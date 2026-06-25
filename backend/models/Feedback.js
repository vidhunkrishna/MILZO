const supabase = require('../config/supabase');

const TABLE = 'feedback';
const COMMENTS_TABLE = 'feedback_comments';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Feedback = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).is('deleted_at', null).single();
    if (error) return null;
    const { data: comments } = await supabase.from(COMMENTS_TABLE).select('*').eq('feedback_id', id).order('created_at', { ascending: true });
    const fb = addIdAlias(data);
    fb.comments = addIdAliasArray(comments);
    return fb;
  },

  async create(body) {
    const record = {
      customer: body.customer,
      order: body.order,
      type: body.type,
      category: body.category,
      rating: body.rating,
      title: body.title,
      description: body.description,
      attachments: body.attachments || [],
      priority: body.priority || 'medium',
      status: body.status || 'open',
      assigned_to: body.assignedTo,
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async update(id, body) {
    const updates = {};
    if (body.type !== undefined) updates.type = body.type;
    if (body.category !== undefined) updates.category = body.category;
    if (body.rating !== undefined) updates.rating = body.rating;
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.status !== undefined) updates.status = body.status;
    if (body.resolution !== undefined) updates.resolution = body.resolution;
    if (body.escalation !== undefined) updates.escalation = body.escalation;
    if (body.assignedTo !== undefined) updates.assigned_to = body.assignedTo;
    if (body.deletedAt !== undefined) updates.deleted_at = body.deletedAt;

    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).is('deleted_at', null).select().single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return addIdAlias(data);
  },

  async addComment(feedbackId, comment) {
    const { error } = await supabase.from(COMMENTS_TABLE).insert({
      feedback_id: feedbackId,
      author: comment.author,
      text: comment.text,
      is_internal: comment.isInternal || false,
    });
    if (error) throw new Error(error.message);
  },

  async softDelete(id) {
    return this.update(id, { deletedAt: new Date().toISOString() });
  },
};

module.exports = Feedback;
