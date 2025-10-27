const asyncHandler = require('express-async-handler');
const NewPartRequest = require('../models/NewPartRequest');
const Brick = require('../models/Brick');
const Notification = require('../models/Notification');

// POST /api/requests
const createRequest = asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    res.status(400);
    throw new Error('Request must have a name');
  }
  
  const data = { 
    ...req.body, 
    user_id: req.user._id 
  };
  
  const request = await NewPartRequest.create(data);
  
  res.status(201).json({
    message: 'New part request submitted successfully',
    request
  });
});

// GET /api/requests
const listRequests = asyncHandler(async (req, res) => {
  const { 
    status, 
    user_id, 
    q, 
    page = 1, 
    limit = 20 
  } = req.query;
  
  const filter = {};
  
  // Regular users can only see their own requests
  if (req.user.role !== 'admin') {
    filter.user_id = req.user._id;
  } else {
    // Admin can filter by user_id if provided
    if (user_id) filter.user_id = user_id;
  }
  
  if (status) filter.status = status;
  
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { part_code: { $regex: q, $options: 'i' } }
    ];
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [data, total] = await Promise.all([
    NewPartRequest.find(filter)
      .populate('user_id', 'username email')
      .populate('reviewed_by', 'username')
      .sort({ date_submitted: -1 })
      .skip(skip)
      .limit(Number(limit)),
    NewPartRequest.countDocuments(filter)
  ]);
  
  res.json({ 
    data, 
    total, 
    page: Number(page), 
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit))
  });
});

// GET /api/requests/:id
const getRequest = asyncHandler(async (req, res) => {
  const request = await NewPartRequest.findById(req.params.id)
    .populate('user_id', 'username email')
    .populate('reviewed_by', 'username');
  
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  // Check permissions
  if (req.user.role !== 'admin' && 
      request.user_id._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have permission to view this request');
  }
  
  res.json(request);
});

// PUT /api/requests/:id (Admin only - approve/reject)
// PUT /api/requests/:id (Admin approve/reject)
const handleRequest = asyncHandler(async (req, res) => {
  const { status, admin_comment } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Status must be either "approved" or "rejected"');
  }
  
  const request = await NewPartRequest.findById(req.params.id);
  
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  if (request.status !== 'submitted') {
    res.status(400);
    throw new Error('This request has already been handled');
  }
  
  request.status = status;
  request.admin_comment = admin_comment;
  request.date_handled = new Date();
  request.reviewed_by = req.user._id;
  await request.save();
  
  if (status === 'approved') {
    // Create brick from request
    const brickData = {
      part_code: request.part_code,
      name: request.name,
      category: request.category,
      color_variants: request.color_variants,
      image_urls: request.image_urls,
      description: request.description,
      created_by: request.user_id,  // ← CHANGED: Use request creator, not admin!
      status: 'published'
    };
    
    // Check for duplicate part_code
    if (brickData.part_code) {
      const existing = await Brick.findOne({ 
        part_code: brickData.part_code.toUpperCase() 
      });
      if (existing) {
        delete brickData.part_code;
      }
    }
    
    const brick = await Brick.create(brickData);
    
    // Notify user
    await Notification.create({
      user_id: request.user_id,
      type: 'request_approved',
      message: `Your new part request "${request.name}" has been approved and added to the catalog!`,
      link: `/bricks/${brick._id}`
    });
    
    return res.json({
      message: 'Request approved and brick created',
      brick,
      request
    });
  }
  
  if (status === 'rejected') {
    // Notify user of rejection
    await Notification.create({
      user_id: request.user_id,
      type: 'request_rejected',
      message: `Your request "${request.name}" was rejected. ${admin_comment || ''}`,
      link: `/my-contributions`
    });
    
    return res.json({
      message: 'Request rejected',
      request
    });
  }
  
  res.json({ message: 'Request updated' });
});

// DELETE /api/requests/:id (Admin only)
const deleteRequest = asyncHandler(async (req, res) => {
  const request = await NewPartRequest.findById(req.params.id);
  
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  await request.deleteOne();
  
  res.json({ message: 'Request deleted successfully' });
});

module.exports = { 
  createRequest, 
  listRequests, 
  getRequest,
  handleRequest, 
  deleteRequest 
};