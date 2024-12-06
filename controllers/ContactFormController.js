const ContactFormModel = require('../models/ContactFormModel');

class ContactFormController {
  static async submitForm(req, res) {
    try {
      const formData = req.body;
      
      // Basic validation
      if (!formData.name || !formData.email || !formData.message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and message are required'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Phone validation (optional field)
      if (formData.phone) {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(formData.phone)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid phone number format'
          });
        }
      }

      if (req.user) {
        formData.userId = req.user.id;
      }

      const result = await ContactFormModel.create(formData);
      
      res.status(201).json({
        success: true,
        message: 'Contact form submitted successfully',
        data: result
      });
    } catch (error) {
      console.error('Contact form submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit contact form',
        error: error.message
      });
    }
  }

  static async getAllForms(req, res) {
    try {
      const forms = await ContactFormModel.getAll();
      res.status(200).json({
        success: true,
        data: forms
      });
    } catch (error) {
      console.error('Fetch contact forms error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contact forms',
        error: error.message
      });
    }
  }

  static async getFormById(req, res) {
    try {
      const { id } = req.params;
      const form = await ContactFormModel.getById(id);
      res.status(200).json({
        success: true,
        data: form
      });
    } catch (error) {
      console.error('Fetch contact form error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contact form',
        error: error.message
      });
    }
  }
}

module.exports = ContactFormController;
