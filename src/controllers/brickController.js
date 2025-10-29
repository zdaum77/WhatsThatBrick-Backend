const Brick = require("../models/Brick");
const User = require("../models/User");

// Pure logic — only interacts with DB and returns data or throws errors

async function listBricksLogic(params, user) {
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
  } = params;

  const filter = {};

  if (user && user.role === "admin") {
    if (status) filter.status = status;
  } else {
    filter.status = "published";
  }

  if (category) filter.category = category.toLowerCase();

  if (color) {
    filter["color_variants.name"] = { $regex: color, $options: "i" };
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

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

  return {
    data,
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  };
}

async function getBrickLogic(id) {
  const brick = await Brick.findById(id).populate(
    "created_by",
    "username email avatar"
  );
  if (!brick) throw new Error("Brick not found");
  return brick;
}

async function createBrickLogic(payload, user) {
  if (!payload.name) throw new Error("Brick name is required");

  if (payload.part_code) {
    const existing = await Brick.findOne({
      part_code: payload.part_code.toUpperCase(),
    });
    if (existing) throw new Error("A brick with this part code already exists");
  }

  payload.created_by = user._id;
  payload.status = user.role === "user" ? "pending" : payload.status || "published";

  const brick = await Brick.create(payload);
  await brick.populate("created_by", "username email");

  return {
    message:
      user.role === "user"
        ? "Brick submitted for review"
        : "Brick created successfully",
    brick,
  };
}

async function updateBrickLogic(id, updates, user) {
  const brick = await Brick.findById(id);
  if (!brick) throw new Error("Brick not found");

  const isOwner =
    brick.created_by && brick.created_by.toString() === user._id.toString();
  const isAdmin = user.role === "admin";

  if (!isOwner && !isAdmin)
    throw new Error("You do not have permission to edit this brick");

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
    if (updates[field] !== undefined) brick[field] = updates[field];
  });

  if (updates.part_code && updates.part_code !== brick.part_code) {
    const existing = await Brick.findOne({
      part_code: updates.part_code.toUpperCase(),
      _id: { $ne: brick._id },
    });
    if (existing) throw new Error("Part code already in use");
    brick.part_code = updates.part_code;
  }

  await brick.save();
  return { message: "Brick updated successfully", brick };
}

async function deleteBrickLogic(id, user) {
  const brick = await Brick.findById(id);
  if (!brick) throw new Error("Brick not found");

  const isOwner =
    brick.created_by && brick.created_by.toString() === user._id.toString();
  const isAdmin = user.role === "admin";

  if (!isOwner && !isAdmin)
    throw new Error("You do not have permission to delete this brick");

  // Delete the brick
  await brick.deleteOne();

  // Remove this brick from ALL users' favourites
  await User.updateMany(
    { favourites: id },
    { $pull: { favourites: id } }
  );

  return { message: "Brick deleted successfully" };
}

async function getCategoriesLogic() {
  const categories = await Brick.distinct("category", { status: "published" });
  return categories.filter(Boolean).sort();
}

module.exports = {
  listBricksLogic,
  getBrickLogic,
  createBrickLogic,
  updateBrickLogic,
  deleteBrickLogic,
  getCategoriesLogic,
};