const express = require('express');
const {
    getAllInstallations,
    getInstallationById
} = require('../controllers/installations.controller');

const { createInstallation } = require('../controllers/installations.controller');
const router = express.Router();

router.get('/', getAllInstallations);
router.get('/:id', getInstallationById);
router.post('/', createInstallation);

module.exports = router;
