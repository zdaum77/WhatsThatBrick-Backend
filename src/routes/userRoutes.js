const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Brick = require('../models/Brick');

// GET current user's favourites
router.get('/me/favourites', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('favourites');
  res.json(user.favourites);
}));

// POST add to favourites
router.post('/me/favourites/:brickId', authMiddleware, asyncHandler(async (req, res) => {
  const brick = await Brick.findById(req.params.brickId);
  if (!brick) {
    res.status(404);
    throw new Error('Brick not found');
  }

  const user = await User.findById(req.user._id);
  
  if (user.favourites.includes(brick._id)) {
    res.status(400);
    throw new Error('Brick already in favourites');
  }

  user.favourites.push(brick._id);
  await user.save();

  res.json({ message: 'Added to favourites', favourites: user.favourites });
}));

// DELETE remove from favourites
router.delete('/me/favourites/:brickId', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  user.favourites = user.favourites.filter(
    id => id.toString() !== req.params.brickId
  );
  
  await user.save();

  res.json({ message: 'Removed from favourites', favourites: user.favourites });
}));

module.exports = router;