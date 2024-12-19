const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../controllers/LoginController');
const { addToFavorites, removeFromFavorites, getUserFavorites, checkFavoriteStatus} = require('../controllers/AddFavoriteController');

// Add a property to favorite
router.post('/', isAuthenticated, addToFavorites);

// Remove a property from favorites
router.delete('/:propertyId', isAuthenticated, removeFromFavorites);

// Get all favorites for the logged-in user
router.get('/', isAuthenticated, getUserFavorites);

// Check if a property is in user's favorites
router.get('/check/:propertyId', isAuthenticated, checkFavoriteStatus);

module.exports = router;