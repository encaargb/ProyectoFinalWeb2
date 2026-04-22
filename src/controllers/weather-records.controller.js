const { ObjectId } = require('mongodb');
const weatherRecordRepository = require('../repositories/weather-record.repository');
const {
    validateWeatherRecordsFilters,
    validateWeatherRecordsPagination,
    validateWeatherRecordsSorting
} = require('../validators/weather-records.validator');

// Igual que en otros recursos, exponemos id en lugar de _id.
const mapWeatherRecord = (record) => {
    if (!record) return null;
    const { _id, ...rest } = record;
    return { id: _id.toString(), ...rest };
};

// Lista histórico meteorológico permitiendo filtros, paginación y ordenación.
const getAllWeatherRecords = async (req, res) => {
    try {
        const filtersResult = validateWeatherRecordsFilters(req.query);
        if (filtersResult.error) {
            return res.status(400).json({ status: 400, message: filtersResult.error });
        }

        const paginationResult = validateWeatherRecordsPagination(req.query);
        if (paginationResult.error) {
            return res.status(400).json({ status: 400, message: paginationResult.error });
        }

        const sortingResult = validateWeatherRecordsSorting(req.query);
        if (sortingResult.error) {
            return res.status(400).json({ status: 400, message: sortingResult.error });
        }

        const records = await weatherRecordRepository.findAll({
            filter: filtersResult.value,
            sort: sortingResult.value,
            skip: paginationResult.value.skip,
            limit: paginationResult.value.limit
        });

        // Devolvemos también metadatos para que el cliente sepa cómo se paginó y ordenó.
        res.status(200).json({
            data: records.map(mapWeatherRecord),
            pagination: {
                page: paginationResult.value.page,
                limit: paginationResult.value.limit
            },
            sorting: sortingResult.value
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

// Recupera un único registro meteorológico por su _id de MongoDB.
const getWeatherRecordById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Formato de ID no válido' });
        }

        const record = await weatherRecordRepository.findById(id);

        if (!record) {
            return res.status(404).json({ status: 404, message: 'Registro meteorológico no encontrado' });
        }

        res.status(200).json({ data: mapWeatherRecord(record) });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

module.exports = {
    getAllWeatherRecords,
    getWeatherRecordById
};
