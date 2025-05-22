const express = require('express');
const geminiController = require('../controllers/ChatBot_Controller');

const router = express.Router();
router.post('/generate', geminiController.generateContent);

module.exports = router;
