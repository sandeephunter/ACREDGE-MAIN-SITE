const express = require('express');
const router = express.Router();
const PropertyController = require('../controllers/PropertyController');
const { isAuthenticated } = require('../controllers/LoginController');
const { uploadPropertyMedia } = require('../middlewares/UploadMiddleware');

router.post('/', isAuthenticated, uploadPropertyMedia, PropertyController.createProperty);
router.put('/:id', isAuthenticated, uploadPropertyMedia, PropertyController.updateProperty);
router.get('/my-properties', isAuthenticated, PropertyController.getUserProperties);
router.get('/', PropertyController.getProperties);
router.get('/:id', PropertyController.getProperty);
router.delete('/:id', isAuthenticated, PropertyController.deleteProperty);

module.exports = router;