const express = require('express');
const router = express.Router();

// Este router expone el CRUD público del recurso sports.
const {
    createSport,
    deleteSport,
    getAllSports,
    getSportById,
    patchSport,
    updateSport
} = require('../controllers/sports.controller');

router.get('/', getAllSports);
router.post('/', createSport);
router.get('/:id', getSportById);
router.put('/:id', updateSport);
router.patch('/:id', patchSport);
router.delete('/:id', deleteSport);

module.exports = router;
