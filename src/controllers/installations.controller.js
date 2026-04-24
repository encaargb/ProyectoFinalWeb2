const installationRepository = require('../repositories/installation.repository');
const weatherRecordRepository = require('../repositories/weather-record.repository');
const { ObjectId } = require('mongodb');
const { toXML } = require('jstoxml');
const {
    fetchCurrentWeatherByCoordinates,
    getWeatherConfig,
    isWeatherRecordFresh
} = require('../services/openweather.service');
const {
    validateFilters,
    validateInstallationForXml,
    validateInstallationPayload,
    validatePagination
} = require('../validators/installations.validator');

// Esta función transforma el documento de MongoDB (_id) en una respuesta más cómoda para la API (id).
const mapInstallation = (inst) => {
    if (!inst) return null;
    const { _id, ...rest } = inst;
    return { id: _id.toString(), ...rest };
};

const mapWeatherRecord = (record) => {
    if (!record) return null;
    const { _id, ...rest } = record;
    return {
        id: _id.toString(),
        ...rest,
        installationId: rest.installationId?.toString?.() ?? rest.installationId
    };
};

function getCoordinatesFromInstallation(installation) {
    const coordinates = installation?.location?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        return null;
    }

    const [lon, lat] = coordinates.map((value) => Number(value));
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        return null;
    }

    return { lon, lat };
}

const getAllInstallations = async (req, res) => {
    try {
        // Primero validamos lo que llega por la URL antes de consultar la base de datos.
        const filtersResult = validateFilters(req.query);
        if (filtersResult.error) {
            return res.status(400).json({ status: 400, message: filtersResult.error });
        }

        const paginationResult = validatePagination(req.query);
        if (paginationResult.error) {
            return res.status(400).json({ status: 400, message: paginationResult.error });
        }

        const installations = await installationRepository.findAll(
            filtersResult.value,
            paginationResult.value.skip,
            paginationResult.value.limit
        );
        // El controlador adapta el resultado del repositorio al formato final de la API.
        const mappedData = installations.map(mapInstallation);

        res.status(200).json({
            data: mappedData,
            pagination: {
                page: paginationResult.value.page,
                limit: paginationResult.value.limit
            }
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

const getInstallationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Formato de ID no válido' });
        }

        const installation = await installationRepository.findById(id);

        if (!installation) {
            return res.status(404).json({ status: 404, message: 'Instalación no encontrada' });
        }

        const mappedData = mapInstallation(installation);

        const acceptHeader = req.get('Accept');
        if (acceptHeader && acceptHeader.includes('application/xml')) {
            // Aunque la instalación exista, comprobamos que tenga la estructura mínima
            // antes de convertirla a XML.
            const xmlValidation = validateInstallationForXml(mappedData);
            if (xmlValidation.error) {
                return res.status(500).json({ status: 500, message: xmlValidation.error });
            }

            const xmlOptions = {
                header: true,
                indent: '  '
            };
            const xmlContent = toXML({ installation: mappedData }, xmlOptions);
            res.set('Content-Type', 'application/xml');
            return res.status(200).send(xmlContent);
        }

        // Si no se pide XML, la salida por defecto es JSON.
        res.status(200).json({ data: mappedData });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

// Este endpoint reutiliza el weather más reciente si sigue vigente; si no, consulta OpenWeather.
const getInstallationWeather = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Formato de ID no válido' });
        }

        const installation = await installationRepository.findById(id);
        if (!installation) {
            return res.status(404).json({ status: 404, message: 'Instalación no encontrada' });
        }

        const coordinates = getCoordinatesFromInstallation(installation);
        if (!coordinates) {
            return res.status(400).json({
                status: 400,
                message: 'La instalación no tiene coordenadas válidas para consultar meteorología'
            });
        }

        const { ttlMinutes } = getWeatherConfig();
        const latestRecord = await weatherRecordRepository.findLatestByInstallationId(id);

        if (latestRecord && isWeatherRecordFresh(latestRecord.queryDate, ttlMinutes)) {
            return res.status(200).json({ data: mapWeatherRecord(latestRecord) });
        }

        const weatherPayload = await fetchCurrentWeatherByCoordinates({
            lat: coordinates.lat,
            lon: coordinates.lon
        });

        const createdRecord = await weatherRecordRepository.create({
            installationId: new ObjectId(id),
            ...weatherPayload
        });

        return res.status(200).json({ data: mapWeatherRecord(createdRecord) });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ status: error.status, message: error.message });
        }

        return res.status(500).json({ status: 500, message: error.message });
    }
};

const createInstallation = async (req, res) => {
    try {
        // El validador también normaliza textos y aplica valores por defecto.
        const validationResult = validateInstallationPayload(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                status: 400,
                message: validationResult.error
            });
        }

        const result = await installationRepository.create(validationResult.value);
        res.status(201).json({ data: mapInstallation(result) });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

const updateInstallation = async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Formato de ID no válido' });
        }

        // En este proyecto PUT exige el documento completo, igual que POST.
        const validationResult = validateInstallationPayload(req.body);
        if (validationResult.error) {
            return res.status(400).json({
                status: 400,
                message: validationResult.error
            });
        }

        const updatedInstallation = await installationRepository.update(id, validationResult.value);

        if (!updatedInstallation) {
            return res.status(404).json({
                status: 404,
                message: 'Instalación no encontrada'
            });
        }

        res.status(200).json({ data: mapInstallation(updatedInstallation) });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

const deleteInstallation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Formato de ID no válido' });
        }

        const deleted = await installationRepository.remove(id);

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                message: 'Instalación no encontrada'
            });
        }

        res.status(200).json({
            status: 200,
            message: 'Instalación eliminada correctamente'
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

module.exports = {
    getAllInstallations,
    getInstallationById,
    getInstallationWeather,
    createInstallation,
    updateInstallation,
    deleteInstallation
};
