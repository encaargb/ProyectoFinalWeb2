const express = require('express');
const router = express.Router();

const {
    getAllWeatherRecords,
    getWeatherRecordById
} = require('../controllers/weather-records.controller');

router.get('/', getAllWeatherRecords);
router.get('/:id', getWeatherRecordById);

module.exports = router;
