const express = require('express');
const router = express.Router();
const notifCtrl = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, notifCtrl.getNotifications);
router.put('/read-all', authMiddleware, notifCtrl.markAllAsRead);
router.put('/:id/read', authMiddleware, notifCtrl.markAsRead);
router.delete('/:id', authMiddleware, notifCtrl.deleteNotification);

module.exports = router;