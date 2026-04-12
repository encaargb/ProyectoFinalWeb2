const express = require('express');
const {
    getAllInstallations,
    getInstallationById
} = require('../controllers/installations.controller');

const router = express.Router();

router.get('/', getAllInstallations);
router.get('/:id', getInstallationById);

module.exports = router;
