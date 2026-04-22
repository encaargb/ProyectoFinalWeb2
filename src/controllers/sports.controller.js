const { ObjectId } = require('mongodb');
const sportRepository = require('../repositories/sport.repository');
const {
    validateSportPayload,
    validateSportsFilters,
    validateSportsPagination
} = require('../validators/sports.validator');

// Igual que en installations, exponemos id en vez de _id en la API.
const mapSport = (sport) => {
    if (!sport) return null;
    const { _id, ...rest } = sport;
    return { id: _id.toString(), ...rest };
};

// Lista deportes con filtros opcionales y paginación.
const getAllSports = async (req, res) => {
    try {
        // Validamos filtros y paginación antes de consultar MongoDB.
        const filtersResult = validateSportsFilters(req.query);
        if (filtersResult.error) {
            return res.status(400).json({ status: 400, message: filtersResult.error });
        }

        const paginationResult = validateSportsPagination(req.query);
        if (paginationResult.error) {
            return res.status(400).json({ status: 400, message: paginationResult.error });
        }

        const sports = await sportRepository.findAll(
            filtersResult.value,
            paginationResult.value.skip,
            paginationResult.value.limit
        );

        // El listado devuelve datos y metadatos de paginación.
        res.status(200).json({
            data: sports.map(mapSport),
            pagination: {
                page: paginationResult.value.page,
                limit: paginationResult.value.limit
            }
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

// Devuelve el detalle de un deporte a partir de su id.
const getSportById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Formato de ID no válido' });
        }

        const sport = await sportRepository.findById(id);

        if (!sport) {
            return res.status(404).json({ status: 404, message: 'Deporte no encontrado' });
        }

        res.status(200).json({ data: mapSport(sport) });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

// Crea un deporte nuevo con validación previa del body JSON.
const createSport = async (req, res) => {
    try {
        // POST requiere documento completo según el contrato actual.
        const validationResult = validateSportPayload(req.body);
        if (validationResult.error) {
            return res.status(400).json({ status: 400, message: validationResult.error });
        }

        const result = await sportRepository.create(validationResult.value);
        res.status(201).json({ data: mapSport(result) });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

// PUT exige el documento completo del deporte.
const updateSport = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Formato de ID no válido' });
        }

        const validationResult = validateSportPayload(req.body);
        if (validationResult.error) {
            return res.status(400).json({ status: 400, message: validationResult.error });
        }

        const updatedSport = await sportRepository.update(id, validationResult.value);

        if (!updatedSport) {
            return res.status(404).json({ status: 404, message: 'Deporte no encontrado' });
        }

        res.status(200).json({ data: mapSport(updatedSport) });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

// PATCH solo modifica los campos enviados por el cliente.
const patchSport = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Formato de ID no válido' });
        }

        const validationResult = validateSportPayload(req.body, { partial: true });
        if (validationResult.error) {
            return res.status(400).json({ status: 400, message: validationResult.error });
        }

        if (Object.keys(validationResult.value).length === 0) {
            return res.status(400).json({ status: 400, message: 'Debes indicar al menos un campo para actualizar.' });
        }

        // PATCH solo toca los campos enviados, sin exigir documento completo.
        const updatedSport = await sportRepository.update(id, validationResult.value);

        if (!updatedSport) {
            return res.status(404).json({ status: 404, message: 'Deporte no encontrado' });
        }

        res.status(200).json({ data: mapSport(updatedSport) });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

// El borrado devuelve un mensaje simple y no expone el documento eliminado.
const deleteSport = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Formato de ID no válido' });
        }

        const deleted = await sportRepository.remove(id);

        if (!deleted) {
            return res.status(404).json({ status: 404, message: 'Deporte no encontrado' });
        }

        res.status(200).json({
            status: 200,
            message: 'Deporte eliminado correctamente'
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

module.exports = {
    createSport,
    deleteSport,
    getAllSports,
    getSportById,
    patchSport,
    updateSport
};
