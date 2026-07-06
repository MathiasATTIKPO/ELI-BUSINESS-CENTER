const Notification = require('../models/Notification');
const Employee = require('../models/Employee');

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const DEFAULT_PRIORITY = 'medium';
const DEFAULT_CHANNEL = 'in_app';

const normalizePriority = (priority) => {
  return VALID_PRIORITIES.includes(priority) ? priority : DEFAULT_PRIORITY;
};

const buildEventKey = ({ recipientId, recipientRole, type, requestId, reference }) => {
  return [recipientId || 'system', recipientRole || 'unknown', type || 'unknown', requestId || '', reference || ''].join(':');
};

const normalizeNotificationInput = (payload = {}) => {
  const normalized = {
    ...payload,
    priority: normalizePriority(payload.priority),
    channel: payload.channel || DEFAULT_CHANNEL,
    metadata: payload.metadata || {},
    status: payload.status || (payload.read ? 'read' : 'unread')
  };

  normalized.eventKey = payload.eventKey || buildEventKey(normalized);
  if (payload.read === true) normalized.status = 'read';
  if (payload.read === false) normalized.status = 'unread';

  return normalized;
};

const createNotification = async (payload) => {
  try {
    const normalized = normalizeNotificationInput(payload);
    const existing = await Notification.findOne({ eventKey: normalized.eventKey });

    if (existing) {
      return existing;
    }

    const created = await Notification.create(normalized);
    console.info(`[notifications] created:${normalized.type}:${normalized.recipientRole}:${normalized.recipientId}`);
    return created;
  } catch (error) {
    console.error('[notifications] create failed:', error.message);
    return null;
  }
};

const notifyUsers = async ({ recipients, recipientRole, ...payload }) => {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return [];
  }

  const created = [];
  for (const recipient of recipients) {
    const recipientId = recipient._id || recipient.id || recipient;
    const role = recipient.role || recipientRole || 'admin';
    const notification = await createNotification({
      ...payload,
      recipientId,
      recipientRole: role
    });

    if (notification) {
      created.push(notification);
    }
  }

  return created;
};

const notifyRole = async ({ role, ...payload }) => {
  try {
    const users = await Employee.find({ role, isActive: true });
    if (!users.length) {
      console.info(`[notifications] no active user for role:${role}`);
      return [];
    }

    return notifyUsers({ recipients: users, recipientRole: role, ...payload });
  } catch (error) {
    console.error('[notifications] notifyRole failed:', error.message);
    return [];
  }
};

const notifyAdmins = async (payload) => notifyRole({ role: 'admin', ...payload });
const notifyCashiers = async (payload) => notifyRole({ role: 'cashier', ...payload });

const notifyTechnician = async (repairOrTradein, type, title, message, extra = {}) => {
  const assignedToId = repairOrTradein?.assignedTo?._id || repairOrTradein?.assignedTo;

  if (!assignedToId) {
    console.info('[notifications] no technician assigned');
    return null;
  }

  return createNotification({
    recipientId: assignedToId,
    recipientRole: 'technician',
    type,
    title,
    message,
    requestId: repairOrTradein?._id,
    clientName: repairOrTradein?.clientName,
    reference: repairOrTradein?._id?.toString?.().slice(-6),
    ...extra
  });
};

module.exports = {
  createNotification,
  notifyUsers,
  notifyRole,
  notifyAdmins,
  notifyCashiers,
  notifyTechnician,
  normalizeNotificationInput,
  buildEventKey
};
