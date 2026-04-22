const express = require('express');
const router = express.Router();

// De momento este recurso sigue siendo un placeholder hasta la siguiente iteración.
/**
 * @route GET /weather-records
 * @desc Obtener registros meteorológicos (Próximamente)
 */
router.get('/', (req, res) => {
    res.status(200).json({ message: 'Weather records endpoint - Work in progress' });
});

module.exports = router;
