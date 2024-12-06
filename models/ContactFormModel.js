const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class ContactFormModel {
  static async create(formData) {
    try {
      const contactRef = db.collection('ContactForm');
      const timestamp = new Date().toISOString();
      const uniqueId = uuidv4();
      
      const newContact = {
        id: uniqueId,
        name: formData.name,
        phone: formData.phone,
        message: formData.message,
        email: formData.email,
        position: formData.position,
        time: formData.time,
        createdAt: timestamp,
        updatedAt: timestamp,
        userId: formData.userId || null
      };

      // Use the unique ID as the document ID
      await contactRef.doc(uniqueId).set(newContact);
      return newContact;
    } catch (error) {
      throw new Error(`Failed to create contact form: ${error.message}`);
    }
  }

  static async getAll() {
    try {
      const contactsSnapshot = await db.collection('ContactForm')
        .orderBy('createdAt', 'desc')
        .get();
      
      return contactsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      throw new Error(`Failed to fetch contact forms: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const contactDoc = await db.collection('ContactForm').doc(id).get();
      if (!contactDoc.exists) {
        throw new Error('Contact form not found');
      }
      return contactDoc.data();
    } catch (error) {
      throw new Error(`Failed to fetch contact form: ${error.message}`);
    }
  }
}

module.exports = ContactFormModel;