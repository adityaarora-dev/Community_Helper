const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatController');

/**
 * POST /api/chat
 * Accepts natural language query or structured demographic inputs
 */
router.post('/', require('../services/citizenSession').requireCitizen, handleChat);

module.exports = router;
