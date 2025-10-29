const express = require("express");
const asyncHandler = require("express-async-handler");
const {
  listBricksLogic,
  getBrickLogic,
  createBrickLogic,
  updateBrickLogic,
  deleteBrickLogic,
  getCategoriesLogic,
} = require("../controllers/brickController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await listBricksLogic(req.query, req.user);
    res.status(200).json(result);
  })
);

router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const result = await getCategoriesLogic();
    res.status(200).json(result);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await getBrickLogic(req.params.id);
    res.status(200).json(result);
  })
);

// Protected routes
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await createBrickLogic(req.body, req.user);
    res.status(201).json(result);
  })
);

router.put(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await updateBrickLogic(req.params.id, req.body, req.user);
    res.status(200).json(result);
  })
);

router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await deleteBrickLogic(req.params.id, req.user);
    res.status(200).json(result);
  })
);

module.exports = router;
