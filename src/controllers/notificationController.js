const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, read } = req.query;
  
  const filter = { user_id: req.user._id };
  
  if (read !== undefined) {
    filter.read = read === 'true';
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [data, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user_id: req.user._id, read: false })
  ]);
  
  res.json({ 
    data, 
    total,
    unreadCount,
    page: Number(page), 
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit))
  });
});

// PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user_id: req.user._id
  });
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  notification.read = true;
  await notification.save();
  
  res.json({ message: 'Notification marked as read', notification });
});

// PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user_id: req.user._id, read: false },
    { read: true }
  );
  
  res.json({ message: 'All notifications marked as read' });
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user_id: req.user._id
  });
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  await notification.deleteOne();
  
  res.json({ message: 'Notification deleted' });
});

module.exports = { 
  getNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification 
};