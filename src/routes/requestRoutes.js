const express = require('express');
const router = express.Router();
const reqCtrl = require('../controllers/requestController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.post('/', authMiddleware, reqCtrl.createRequest);
router.get('/', authMiddleware, reqCtrl.listRequests);
router.get('/:id', authMiddleware, reqCtrl.getRequest);
router.put('/:id', authMiddleware, requireRole(['admin']), reqCtrl.handleRequest);
router.delete('/:id', authMiddleware, requireRole(['admin']), reqCtrl.deleteRequest);

module.exports = router;