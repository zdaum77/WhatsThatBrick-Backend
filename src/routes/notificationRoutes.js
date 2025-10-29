const express = require("express");
const asyncHandler = require("express-async-handler");
const {
  getNotificationsLogic,
  markAsReadLogic,
  markAllAsReadLogic,
  deleteNotificationLogic,
} = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await getNotificationsLogic(req.query, req.user._id);
    res.status(200).json(result);
  })
);

router.put(
  "/read-all",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await markAllAsReadLogic(req.user._id);
    res.status(200).json(result);
  })
);

router.put(
  "/:id/read",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await markAsReadLogic(req.params.id, req.user._id);
    res.status(200).json(result);
  })
);

router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await deleteNotificationLogic(req.params.id, req.user._id);
    res.status(200).json(result);
  })
);

module.exports = router;
