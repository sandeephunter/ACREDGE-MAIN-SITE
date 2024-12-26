const { db } = require('../config/firebase');
const Favorite = require('../models/AddFavoriteModel');

exports.addToFavorites = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user.phoneNumber;

    // Validate inputs
    if (!propertyId || typeof propertyId !== 'string' || propertyId.trim() === '') {
      return res.status(400).json({ message: 'Valid propertyId is required' });
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return res.status(401).json({ message: 'User not properly authenticated' });
    }

    // Check if property exists
    const Property = require('../models/PropertyModel');
    console.log('Checking property:', propertyId);
    const propertyDoc = await db.collection(Property.collectionName).doc(propertyId.trim()).get();
    if (!propertyDoc.exists) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if already in favorites
    const existingFavorite = await db.collection(Favorite.collectionName)
      .where('userId', '==', userId)
      .where('propertyId', '==', propertyId.trim())
      .get();

    if (!existingFavorite.empty) {
      return res.status(400).json({ message: 'Property already in favorites' });
    }

    const favoriteData = {
      userId,
      propertyId: propertyId.trim(),
      createdAt: new Date()
    };

    // Validate favorite data
    const favorite = new Favorite(favoriteData);
    const errors = Favorite.validate(favoriteData);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Add to favorites
    const docRef = await db.collection(Favorite.collectionName).add(favorite.toFirestore());

    res.status(201).json({ 
      message: 'Added to favorites successfully',
      favoriteId: docRef.id
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ 
      message: 'Failed to add to favorites',
      error: error.message 
    });
  }
};

exports.removeFromFavorites = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.phoneNumber;

    if (!propertyId || typeof propertyId !== 'string' || propertyId.trim() === '') {
      return res.status(400).json({ message: 'Valid propertyId is required' });
    }

    const favoriteSnapshot = await db.collection(Favorite.collectionName)
      .where('userId', '==', userId)
      .where('propertyId', '==', propertyId.trim())
      .get();

    if (favoriteSnapshot.empty) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    // Delete the favorite
    await db.collection(Favorite.collectionName).doc(favoriteSnapshot.docs[0].id).delete();

    res.status(200).json({ message: 'Removed from favorites successfully' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ 
      message: 'Failed to remove from favorites',
      error: error.message 
    });
  }
};

exports.getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.phoneNumber;
    const Property = require('../models/PropertyModel');

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return res.status(401).json({ message: 'User not properly authenticated' });
    }

    // Get all favorites for the user
    const favoritesSnapshot = await db.collection(Favorite.collectionName)
      .where('userId', '==', userId)
      .get();

    const favorites = [];
    
    // Get the actual property details for each favorite
    for (const doc of favoritesSnapshot.docs) {
      const favoriteData = doc.data();
      
      const propertyDoc = await db.collection(Property.collectionName)
        .doc(favoriteData.propertyId)
        .get();
      
      if (propertyDoc.exists) {
        const propertyData = propertyDoc.data();
        favorites.push({
          id: propertyDoc.id,
          ...propertyData,
          favoriteId: doc.id
        });
      } else {
      }
    }

    res.status(200).json(favorites);
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ 
      message: 'Failed to get favorites',
      error: error.message 
    });
  }
};

exports.checkFavoriteStatus = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.phoneNumber;

    if (!propertyId || typeof propertyId !== 'string' || propertyId.trim() === '') {
      return res.status(400).json({ message: 'Valid propertyId is required' });
    }

    const favoriteSnapshot = await db.collection(Favorite.collectionName)
      .where('userId', '==', userId)
      .where('propertyId', '==', propertyId.trim())
      .get();

    res.status(200).json({ isFavorite: !favoriteSnapshot.empty });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ 
      message: 'Failed to check favorite status',
      error: error.message 
    });
  }
};