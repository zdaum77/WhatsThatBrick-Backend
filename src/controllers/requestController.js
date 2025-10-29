const NewPartRequest = require("../models/NewPartRequest");
const Brick = require("../models/Brick");
const Notification = require("../models/Notification");

// --- Logic Functions (no res/req) ---

async function createRequestLogic(data, user) {
  if (!data.name) throw new Error("Request must have a name");

  const payload = { ...data, user_id: user._id };
  const request = await NewPartRequest.create(payload);

  return {
    message: "New part request submitted successfully",
    request,
  };
}

async function listRequestsLogic(query, user) {
  const { status, user_id, q, page = 1, limit = 20 } = query;
  const filter = {};

  if (user.role !== "admin") {
    filter.user_id = user._id;
  } else if (user_id) {
    filter.user_id = user_id;
  }

  if (status) filter.status = status;

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { part_code: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    NewPartRequest.find(filter)
      .populate("user_id", "username email")
      .populate("reviewed_by", "username")
      .sort({ date_submitted: -1 })
      .skip(skip)
      .limit(Number(limit)),
    NewPartRequest.countDocuments(filter),
  ]);

  return {
    data,
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  };
}

async function getRequestLogic(id, user) {
  const request = await NewPartRequest.findById(id)
    .populate("user_id", "username email")
    .populate("reviewed_by", "username");

  if (!request) throw new Error("Request not found");

  if (
    user.role !== "admin" &&
    request.user_id._id.toString() !== user._id.toString()
  ) {
    throw new Error("You do not have permission to view this request");
  }

  return request;
}

async function handleRequestLogic(id, data, adminUser) {
  const { status, admin_comment } = data;

  if (!["approved", "rejected"].includes(status)) {
    throw new Error('Status must be either "approved" or "rejected"');
  }

  const request = await NewPartRequest.findById(id);
  if (!request) throw new Error("Request not found");

  if (request.status !== "submitted") {
    throw new Error("This request has already been handled");
  }

  request.status = status;
  request.admin_comment = admin_comment;
  request.date_handled = new Date();
  request.reviewed_by = adminUser._id;
  await request.save();

  if (status === "approved") {
    const brickData = {
      part_code: request.part_code,
      name: request.name,
      category: request.category,
      color_variants: request.color_variants,
      image_urls: request.image_urls,
      description: request.description,
      created_by: request.user_id,
      status: "published",
    };

    if (brickData.part_code) {
      const existing = await Brick.findOne({
        part_code: brickData.part_code.toUpperCase(),
      });
      if (existing) delete brickData.part_code;
    }

    const brick = await Brick.create(brickData);

    await Notification.create({
      user_id: request.user_id,
      type: "request_approved",
      message: `Your new part request "${request.name}" has been approved and added to the catalog!`,
      link: `/bricks/${brick._id}`,
    });

    return {
      message: "Request approved and brick created",
      brick,
      request,
    };
  }

  if (status === "rejected") {
    await Notification.create({
      user_id: request.user_id,
      type: "request_rejected",
      message: `Your request "${request.name}" was rejected. ${
        admin_comment || ""
      }`,
      link: `/my-contributions`,
    });

    return {
      message: "Request rejected",
      request,
    };
  }

  return { message: "Request updated" };
}

async function deleteRequestLogic(id) {
  const request = await NewPartRequest.findById(id);
  if (!request) throw new Error("Request not found");

  await request.deleteOne();
  return { message: "Request deleted successfully" };
}

module.exports = {
  createRequestLogic,
  listRequestsLogic,
  getRequestLogic,
  handleRequestLogic,
  deleteRequestLogic,
};
