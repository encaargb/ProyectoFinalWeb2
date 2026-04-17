const express = require('express');
const router = express.Router();

/**
 * @route GET /sports
 * @desc Obtener todos los deportes (Próximamente)
 */
router.get('/', (req, res) => {
    res.status(200).json({ message: 'Sports endpoint - Work in progress' });
});

module.exports = router;
