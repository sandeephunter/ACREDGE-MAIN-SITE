const SearchService = require('../services/SearchService');
const { db } = require('../config/firebase');

class SearchController {
  async search(req, res) {
    try {
      const {
        query,
        filters,
        page = 0,
        hitsPerPage = 20
      } = req.body;

      const results = await SearchService.searchProperties({
        query,
        filters,
        page,
        hitsPerPage
      });

      res.json({
        success: true,
        ...results,
        message: results.fallbackSearch 
          ? "No exact matches found. Showing all available properties."
          : `Found ${results.nbHits} properties`
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Error performing search'
      });
    }
  }

  // Sync all existing properties to Algolia
  async syncPropertiesToSearch(req, res) {
    try {
      const snapshot = await db.collection('properties').get();

      if (snapshot.empty) {
        return res.json({
          success: true,
          message: 'No properties to sync'
        });
      }
      
      const operations = snapshot.docs.map(doc => ({
        objectID: doc.id,
        ...doc.data()
      }));

      await SearchService.propertyIndex.saveObjects(operations);

      res.json({
        success: true,
        message: `Successfully synced ${operations.length} properties`
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Error syncing properties'
      });
    }
  }
}

module.exports = new SearchController();