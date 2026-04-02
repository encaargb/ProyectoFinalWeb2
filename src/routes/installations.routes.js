const express = require('express');
const { getAllInstallations } = require('../controllers/installations.controller');
const router = express.Router();

router.get('/', getAllInstallations);
module.exports = router;
