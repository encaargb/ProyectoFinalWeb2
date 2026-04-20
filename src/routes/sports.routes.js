const express = require('express');
const router = express.Router();

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
