const { db } = require('../config/firebase');
const Property = require('../models/PropertyModel');

// Get all properties regardless of status
exports.getAllProperties = async (req, res) => {
  try {
    const snapshot = await db.collection(Property.collectionName).get();
    const properties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(properties);
  } catch (error) {
    console.error('Error getting all properties:', error);
    res.status(500).json({ error: 'Failed to get properties' });
  }
};

// Get properties by status
exports.getPropertiesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['Pending', 'In Review', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status parameter' });
    }

    const snapshot = await db.collection(Property.collectionName)
      .where('status', '==', status)
      .get();

    const properties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(properties);
  } catch (error) {
    console.error('Error getting properties by status:', error);
    res.status(500).json({ error: 'Failed to get properties' });
  }
};

// Update property status
exports.updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionNote } = req.body;

    if (!['Pending', 'In Review', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const propertyRef = db.collection(Property.collectionName).doc(id);
    const propertyDoc = await propertyRef.get();

    if (!propertyDoc.exists) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const updateData = {
      status,
      updatedBy: req.user.phoneNumber,
      updatedOn: new Date()
    };

    // Add rejection note if status is Rejected
    if (status === 'Rejected') {
      if (!rejectionNote) {
        return res.status(400).json({ error: 'Rejection note is required when rejecting a property' });
      }
      updateData.rejectionNote = rejectionNote;
    } else {
      // Remove rejection note if status is not Rejected
      updateData.rejectionNote = null;
    }

    await propertyRef.update(updateData);

    res.status(200).json({
      message: 'Property status updated successfully',
      status: status,
      propertyId: id
    });
  } catch (error) {
    console.error('Error updating property status:', error);
    res.status(500).json({ error: 'Failed to update property status' });
  }
};

// Update property details (admin version)
// exports.updateProperty = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;
    
//     const propertyRef = db.collection(Property.collectionName).doc(id);
//     const propertyDoc = await propertyRef.get();

//     if (!propertyDoc.exists) {
//       return res.status(404).json({ error: 'Property not found' });
//     }

//     // Validate the updated data
//     const property = new Property({
//       ...propertyDoc.data(),
//       ...updateData,
//       updatedBy: req.user.phoneNumber,
//       updatedOn: new Date()
//     });

//     const errors = Property.validate(property);
//     if (errors.length > 0) {
//       return res.status(400).json({ errors });
//     }

//     await propertyRef.update(property.toFirestore());

//     res.status(200).json({
//       message: 'Property updated successfully',
//       propertyId: id
//     });
//   } catch (error) {
//     console.error('Error updating property:', error);
//     res.status(500).json({ error: 'Failed to update property' });
//   }
// };


exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const propertyRef = db.collection(Property.collectionName).doc(id);
    const propertyDoc = await propertyRef.get();

    if (!propertyDoc.exists) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    // Validate the updated data
    const property = new Property({
      ...propertyDoc.data(),
      ...cleanUpdateData,
      updatedBy: req.user.phoneNumber,
      updatedOn: new Date()
    });

    const errors = Property.validate(property);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    await propertyRef.update(property.toFirestore());

    res.status(200).json({
      message: 'Property updated successfully',
      propertyId: id
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
};