const supabase = require('../config/supabase');

const TABLE = 'notifications';
const RECIPIENTS_TABLE = 'notification_recipients';
const READS_TABLE = 'notification_reads';

const addIdAlias = (row) => {
  if (!row) return null;
  return { ...row, _id: row.id };
};
const addIdAliasArray = (rows) => (rows || []).map(addIdAlias);

const Notification = {
  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error) return null;
    const { data: reads } = await supabase.from(READS_TABLE).select('*').eq('notification_id', id);
    const notif = addIdAlias(data);
    notif.readBy = (reads || []).map(r => ({ user: r.user_id, readAt: r.read_at }));
    return notif;
  },

  async create(body) {
    const record = {
      title: body.title,
      message: body.message,
      type: body.type,
      priority: body.priority || 'medium',
      is_global: body.isGlobal || false,
      channels: body.channels || { inApp: true, email: false, sms: false },
      related_entity_type: body.relatedEntity?.entityType,
      related_entity_id: body.relatedEntity?.entityId,
      expires_at: body.expiresAt,
    };
    const { data, error } = await supabase.from(TABLE).insert(record).select().single();
    if (error) throw new Error(error.message);

    // Insert recipients
    if (body.recipients && body.recipients.length > 0) {
      const recipients = body.recipients.map(userId => ({
        notification_id: data.id,
        user_id: userId,
      }));
      await supabase.from(RECIPIENTS_TABLE).insert(recipients);
    }

    return addIdAlias(data);
  },

  async markRead(notificationId, userId) {
    // Upsert - ignore if already read
    await supabase.from(READS_TABLE).upsert({
      notification_id: notificationId,
      user_id: userId,
      read_at: new Date().toISOString(),
    }, { onConflict: 'notification_id,user_id' });
  },

  async markAllReadForUser(userId) {
    // Get all unread notifications for this user
    const { data: notifications } = await supabase.from(TABLE)
      .select('id')
      .or(`is_global.eq.true,id.in.(select notification_id from notification_recipients where user_id = '${userId}')`)
      .is('deleted_at', null);

    if (notifications && notifications.length > 0) {
      const reads = notifications.map(n => ({
        notification_id: n.id,
        user_id: userId,
        read_at: new Date().toISOString(),
      }));
      // Upsert to avoid duplicates
      await supabase.from(READS_TABLE).upsert(reads, { onConflict: 'notification_id,user_id' });
    }
  },

  async findForUser(userId, options = {}) {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get notification IDs where user is recipient OR global
    const { data: recipientNotifs } = await supabase.from(RECIPIENTS_TABLE)
      .select('notification_id')
      .eq('user_id', userId);
    const recipientIds = (recipientNotifs || []).map(r => r.notification_id);

    let query = supabase.from(TABLE).select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (recipientIds.length > 0) {
      query = query.or(`is_global.eq.true,id.in.(${recipientIds.join(',')})`);
    } else {
      query = query.eq('is_global', true);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: addIdAliasArray(data), count };
  },
};

module.exports = Notification;
