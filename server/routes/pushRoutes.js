const express = require('express');
const router = express.Router();

const { subscribePush } = require('../controllers/pushController');

router.post('/subscribe', subscribePush);

module.exports = router;
