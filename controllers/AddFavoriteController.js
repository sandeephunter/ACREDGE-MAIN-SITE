const { db } = require('../config/firebase');
const Favorite = require('../models/AddFavoriteModel');

exports.addToFavorites = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user.phoneNumber;

    // Check if property exists
    const propertyDoc = await db.collection('Properties').doc(propertyId).get();
    if (!propertyDoc.exists) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if already in favorites
    const existingFavorite = await db.collection(Favorite.collectionName)
      .where('userId', '==', userId)
      .where('propertyId', '==', propertyId)
      .get();

    if (!existingFavorite.empty) {
      return res.status(400).json({ message: 'Property already in favorites' });
    }

    const favoriteData = {
      userId,
      propertyId,
      createdAt: new Date()
    };

    // Validate favorite data
    const favorite = new Favorite(favoriteData);
    const errors = Favorite.validate(favoriteData);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Add to favorites
    await db.collection(Favorite.collectionName).add(favorite.toFirestore());

    res.status(201).json({ message: 'Added to favorites successfully' });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ message: 'Failed to add to favorites' });
  }
};

exports.removeFromFavorites = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.phoneNumber;

    const favoriteSnapshot = await db.collection(Favorite.collectionName)
      .where('userId', '==', userId)
      .where('propertyId', '==', propertyId)
      .get();

    if (favoriteSnapshot.empty) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    // Delete the favorite
    await db.collection(Favorite.collectionName).doc(favoriteSnapshot.docs[0].id).delete();

    res.status(200).json({ message: 'Removed from favorites successfully' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ message: 'Failed to remove from favorites' });
  }
};

exports.getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.phoneNumber;

    // Get all favorites for the user
    const favoritesSnapshot = await db.collection(Favorite.collectionName)
      .where('userId', '==', userId)
      .get();

    const favorites = [];
    
    // Get the actual property details for each favorite
    for (const doc of favoritesSnapshot.docs) {
      const propertyDoc = await db.collection('Properties')
        .doc(doc.data().propertyId)
        .get();

      if (propertyDoc.exists) {
        favorites.push({
          id: propertyDoc.id,
          ...propertyDoc.data(),
          favoriteId: doc.id
        });
      }
    }

    res.status(200).json(favorites);
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ message: 'Failed to get favorites' });
  }
};

exports.checkFavoriteStatus = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.phoneNumber;

    const favoriteSnapshot = await db.collection(Favorite.collectionName)
      .where('userId', '==', userId)
      .where('propertyId', '==', propertyId)
      .get();

    res.status(200).json({ isFavorite: !favoriteSnapshot.empty });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ message: 'Failed to check favorite status' });
  }
};