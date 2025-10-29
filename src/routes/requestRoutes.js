const express = require("express");
const asyncHandler = require("express-async-handler");
const {
  createRequestLogic,
  listRequestsLogic,
  getRequestLogic,
  handleRequestLogic,
  deleteRequestLogic,
} = require("../controllers/requestController");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /api/requests
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await createRequestLogic(req.body, req.user);
    res.status(201).json(result);
  })
);

// GET /api/requests
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await listRequestsLogic(req.query, req.user);
    res.status(200).json(result);
  })
);

// GET /api/requests/:id
router.get(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await getRequestLogic(req.params.id, req.user);
    res.status(200).json(result);
  })
);

// PUT /api/requests/:id (Admin only)
router.put(
  "/:id",
  authMiddleware,
  requireRole(["admin"]),
  asyncHandler(async (req, res) => {
    const result = await handleRequestLogic(req.params.id, req.body, req.user);
    res.status(200).json(result);
  })
);

// DELETE /api/requests/:id (Admin only)
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["admin"]),
  asyncHandler(async (req, res) => {
    const result = await deleteRequestLogic(req.params.id);
    res.status(200).json(result);
  })
);

module.exports = router;
