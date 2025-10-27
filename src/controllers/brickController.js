const asyncHandler = require("express-async-handler");
const Brick = require("../models/Brick");

// GET /api/bricks
// Query params: q, category, color, dateFrom, dateTo, page, limit, sort
const listBricks = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    color,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    sort = "-createdAt",
    status = "published",
  } = req.query;

  const filter = {};

  // Only admins can see non-published bricks
  if (req.user && req.user.role === "admin") {
    if (status) filter.status = status;
  } else {
    filter.status = "published";
  }

  if (category) {
    filter.category = category.toLowerCase();
  }

  if (color) {
    filter["color_variants.name"] = { $regex: color, $options: "i" };
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Better search using $or with regex
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { part_code: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    Brick.find(filter)
      .populate("created_by", "username")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Brick.countDocuments(filter),
  ]);

  res.json({
    data,
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  });
});

// GET /api/bricks/:id
const getBrick = asyncHandler(async (req, res) => {
  const brick = await Brick.findById(req.params.id).populate(
    "created_by",
    "username email avatar"
  );

  if (!brick) {
    res.status(404);
    throw new Error("Brick not found");
  }

  res.json(brick);
});

// POST /api/bricks
const createBrick = asyncHandler(async (req, res) => {
  const payload = req.body;

  if (!payload.name) {
    res.status(400);
    throw new Error("Brick name is required");
  }

  // Check for duplicate part_code
  if (payload.part_code) {
    const existing = await Brick.findOne({
      part_code: payload.part_code.toUpperCase(),
    });
    if (existing) {
      res.status(400);
      throw new Error("A brick with this part code already exists");
    }
  }

  payload.created_by = req.user._id;

  // Regular users create bricks as pending
  if (req.user.role === "user") {
    payload.status = "pending";
  } else {
    payload.status = payload.status || "published";
  }

  const brick = await Brick.create(payload);

  // Populate creator info before sending
  await brick.populate("created_by", "username email");

  res.status(201).json({
    message:
      req.user.role === "user"
        ? "Brick submitted for review"
        : "Brick created successfully",
    brick,
  });
});

// PUT /api/bricks/:id
// PUT /api/bricks/:id
const updateBrick = asyncHandler(async (req, res) => {
  const brick = await Brick.findById(req.params.id);

  if (!brick) {
    res.status(404);
    throw new Error("Brick not found");
  }

  // Check if user is owner or admin
  const isOwner =
    brick.created_by && brick.created_by.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("You do not have permission to edit this brick");
  }
  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("You do not have permission to edit this brick");
  }

  // Update fields
  const allowedFields = [
    "name",
    "category",
    "color_variants",
    "image_urls",
    "description",
    "set_appearances",
    "dimensions",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      brick[field] = req.body[field];
    }
  });

  // Handle part_code specially (check uniqueness)
  if (req.body.part_code && req.body.part_code !== brick.part_code) {
    const existing = await Brick.findOne({
      part_code: req.body.part_code.toUpperCase(),
      _id: { $ne: brick._id },
    });
    if (existing) {
      res.status(400);
      throw new Error("Part code already in use");
    }
    brick.part_code = req.body.part_code;
  }

  await brick.save();

  res.json({
    message: "Brick updated successfully",
    brick,
  });
});

// DELETE /api/bricks/:id
const deleteBrick = asyncHandler(async (req, res) => {
  const brick = await Brick.findById(req.params.id);

  if (!brick) {
    res.status(404);
    throw new Error("Brick not found");
  }

  // Check if user is owner or admin
  const isOwner =
    brick.created_by && brick.created_by.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  console.log(
    "Delete check - Owner:",
    brick.created_by?.toString(),
    "User:",
    req.user._id.toString(),
    "Match:",
    isOwner
  );

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("You do not have permission to delete this brick");
  }

  await brick.deleteOne();

  res.json({ message: "Brick deleted successfully" });
});

// GET /api/bricks/categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Brick.distinct("category", { status: "published" });
  res.json(categories.filter(Boolean).sort());
});

module.exports = {
  listBricks,
  getBrick,
  createBrick,
  updateBrick,
  deleteBrick,
  getCategories,
};
