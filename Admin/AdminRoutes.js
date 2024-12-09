const express = require('express');
const router = express.Router();
const AdminController = require('./AdminController');
const { isAuthenticated } = require('../controllers/LoginController');
const { isAdmin } = require('./AdminMiddleware');
const { uploadPropertyMedia } = require('../middlewares/UploadMiddleware');

// Get all properties routes
router.get('/properties/all', isAuthenticated, isAdmin, AdminController.getAllProperties);
router.get('/properties/status/:status', isAuthenticated, isAdmin, AdminController.getPropertiesByStatus);

// Update routes
router.put('/properties/:id/status', isAuthenticated, isAdmin, AdminController.updatePropertyStatus);
router.put('/properties/:id', isAuthenticated, isAdmin, uploadPropertyMedia, AdminController.updateProperty);

module.exports = router;