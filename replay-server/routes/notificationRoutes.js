const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/notify-arduino', notificationController.notifyArduino);

module.exports = router;