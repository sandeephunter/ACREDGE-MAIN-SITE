const admin = require('firebase-admin');

class Favorite {
    static collectionName = 'Favorites';
  
    constructor(data) {
      this.userId = data.userId;
      this.propertyId = data.propertyId;
      this.createdAt = data.createdAt;
    }
  
    static validate(data) {
      const errors = [];
  
      if (!data.userId) {
        errors.push('User ID is required');
      }
  
      if (!data.propertyId) {
        errors.push('Property ID is required');
      }
  
      return errors;
    }
  
    toFirestore() {
      return {
        userId: this.userId,
        propertyId: this.propertyId,
        createdAt: this.createdAt
      };
    }
  }
  
  module.exports = Favorite;