const express = require('express');
const router = express.Router();
const ContactFormController = require('../controllers/ContactFormController');

router.post('/submit', ContactFormController.submitForm);
router.get('/all', ContactFormController.getAllForms);
router.get('/:id', ContactFormController.getFormById);

module.exports = router;