const express = require('express');
const router = express.Router();
const brickCtrl = require('../controllers/brickController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Public routes
router.get('/', brickCtrl.listBricks);
router.get('/categories', brickCtrl.getCategories);
router.get('/:id', brickCtrl.getBrick);

// Protected routes
router.post('/', authMiddleware, brickCtrl.createBrick);

// Edit and Delete - ownership check is in the controller
router.put('/:id', authMiddleware, brickCtrl.updateBrick);
router.delete('/:id', authMiddleware, brickCtrl.deleteBrick);

module.exports = router;