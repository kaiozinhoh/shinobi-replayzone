const express = require('express');
const router = express.Router();
const replayController = require('../controllers/replayController');

router.get('/replay', replayController.processReplay);

module.exports = router;