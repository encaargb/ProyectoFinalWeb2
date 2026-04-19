const installationRepository = require('../repositories/installation.repository');
const { ObjectId } = require('mongodb');
const { toXML } = require('jstoxml');
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

        res.status(200).json({ data: mappedData });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
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
    createInstallation,
    updateInstallation,
    deleteInstallation
};
