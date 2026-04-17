const express = require('express');
const router = express.Router();

/**
 * @route GET /weather-records
 * @desc Obtener registros meteorológicos (Próximamente)
 */
router.get('/', (req, res) => {
    res.status(200).json({ message: 'Weather records endpoint - Work in progress' });
});

module.exports = router;
