const express = require('express');
const router = express.Router();

// El router solo define qué URL llama a cada función del controlador.
const {
    getAllInstallations,
    getInstallationById,
    getInstallationWeather,
    createInstallation,
    updateInstallation,
    deleteInstallation,
} = require('../controllers/installations.controller');

router.get('/', getAllInstallations);
router.get('/:id/weather', getInstallationWeather);
router.get('/:id', getInstallationById);
router.post('/', createInstallation);
router.put('/:id', updateInstallation);
router.delete('/:id', deleteInstallation);

module.exports = router;
