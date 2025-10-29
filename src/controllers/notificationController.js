const Notification = require("../models/Notification");

// Pure logic — only handles DB operations and returns data/results

async function getNotificationsLogic(query, userId) {
  const { page = 1, limit = 20, read } = query;

  const filter = { user_id: userId };

  if (read !== undefined) {
    filter.read = read === "true";
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user_id: userId, read: false }),
  ]);

  return {
    data,
    total,
    unreadCount,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  };
}

async function markAsReadLogic(id, userId) {
  const notification = await Notification.findOne({
    _id: id,
    user_id: userId,
  });

  if (!notification) throw new Error("Notification not found");

  notification.read = true;
  await notification.save();

  return { message: "Notification marked as read", notification };
}

async function markAllAsReadLogic(userId) {
  await Notification.updateMany({ user_id: userId, read: false }, { read: true });
  return { message: "All notifications marked as read" };
}

async function deleteNotificationLogic(id, userId) {
  const notification = await Notification.findOne({
    _id: id,
    user_id: userId,
  });

  if (!notification) throw new Error("Notification not found");

  await notification.deleteOne();

  return { message: "Notification deleted" };
}

module.exports = {
  getNotificationsLogic,
  markAsReadLogic,
  markAllAsReadLogic,
  deleteNotificationLogic,
};
