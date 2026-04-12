const express = require('express');
const router = express.Router();

const {
    getAllInstallations,
    getInstallationById,
    createInstallation,
    updateInstallation,
    deleteInstallation,
} = require('../controllers/installations.controller');

router.get('/', getAllInstallations);
router.get('/:id', getInstallationById);
router.post('/', createInstallation);
router.put('/:id', updateInstallation);
router.delete('/:id', deleteInstallation);

module.exports = router;