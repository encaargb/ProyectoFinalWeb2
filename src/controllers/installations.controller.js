const installationRepository = require('../repositories/installation.repository');
const { ObjectId } = require('mongodb');
const { toXML } = require('jstoxml');

const mapInstallation = (inst) => {
    if (!inst) return null;
    const { _id, ...rest } = inst;
    return { id: _id.toString(), ...rest };
};

const getAllInstallations = async (req, res) => {
    try {
        const { city, type, sport, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (city) filter.city = city;
        if (type) filter.type = type;
        if (sport) filter['sports.name'] = sport;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        const installations = await installationRepository.findAll(filter, skip, limitNumber);
        const mappedData = installations.map(mapInstallation);

        res.status(200).json({ data: mappedData });
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

        // SOPORTE XML (Punto 6.1 de la práctica)
        const acceptHeader = req.get('Accept');
        if (acceptHeader && acceptHeader.includes('application/xml')) {
            const xmlOptions = {
                header: true,
                indent: '  '
            };
            const xmlContent = toXML({ installation: mappedData }, xmlOptions);
            res.set('Content-Type', 'application/xml');
            return res.status(200).send(xmlContent);
        }

        // Respuesta por defecto JSON
        res.status(200).json({ data: mappedData });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

const createInstallation = async (req, res) => {
    try {
        const {
            name,
            type,
            city,
            sports,
            location,
            externalId,
            source
        } = req.body;

        if (!name || !type || !city) {
            return res.status(400).json({
                status: 400,
                message: 'Faltan campos requeridos: name, type y city.'
            });
        }

        const newInstallation = {
            name,
            type,
            city,
            sports: sports || [],
            location: location || { type: 'Point', coordinates: [] },
            externalId: externalId || null,
            source: source || 'manual',
            lastUpdated: new Date()
        };

        const result = await installationRepository.create(newInstallation);
        res.status(201).json({ data: mapInstallation(result) });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

const updateInstallation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            type,
            city,
            sports,
            location,
            externalId,
            source,
            lastUpdated
        } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 400, message: 'Invalid ID format' });
        }

        if (!name || !type || !city) {
            return res.status(400).json({
                status: 400,
                message: 'Missing required fields'
            });
        }

        const updateData = {
            name,
            type,
            city,
            sports: sports || [],
            location: location || { type: 'Point', coordinates: [] },
            externalId,
            source,
            lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date()
        };

        const updatedInstallation = await installationRepository.update(id, updateData);

        if (!updatedInstallation) {
            return res.status(404).json({
                status: 404,
                message: 'Installation not found'
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
            return res.status(400).json({ status: 400, message: 'Invalid ID format' });
        }

        const deleted = await installationRepository.remove(id);

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                message: 'Installation not found'
            });
        }

        res.status(200).json({
            status: 200,
            message: 'Installation deleted successfully'
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
