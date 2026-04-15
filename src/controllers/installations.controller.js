/*
Este archivo recibe la petición HTTP (req) y construye la respuesta (res).

Su trabajo es:

    leer parámetros y body
    validar datos
    decidir qué código HTTP devolver
    llamar al repositorio
    transformar un poco la respuesta si hace falta

O sea: no accede directamente a MongoDB.
Se apoya en installationRepository para eso
*/

const installationRepository = require('../repositories/installation.repository');
const { ObjectId } = require('mongodb');
// const osmService = require('../services/osm.service');
// const { toXML } = require('jstoxml'); // Necesitas: npm install jstoxml

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

        res.status(200).json({ data: installations });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getInstallationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Formato de ID no válido' });
        }

        const installation = await installationRepository.findById(id);

        if (!installation) {
            return res.status(404).json({ message: 'Instalación no encontrada' });
        }

        // SOPORTE XML (Punto 6.1 de la práctica)

        // Respuesta por defecto JSON
        res.status(200).json({ data: installation });
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        // 1. Validación estricta según especificación
        if (!name || !type || !city) {
            return res.status(400).json({
                status: 400,
                message: 'Faltan campos requeridos: name, type y city.'
            });
        }

        // 2. Estructura base del documento
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

        // 3. ENRIQUECIMIENTO: Si no hay coordenadas, llamar a OSM (Punto 4 de la práctica)

        // 4. Guardar en MongoDB Nativo
        const result = await installationRepository.create(newInstallation);

        res.status(201).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
            return res.status(400).json({ message: 'Invalid ID format' });
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

        res.status(200).json({ data: updatedInstallation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteInstallation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const deleted = await installationRepository.remove(id);

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                message: 'Installation not found'
            });
        }

        res.status(200).json({
            message: 'Installation deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllInstallations,
    getInstallationById,
    createInstallation,
    updateInstallation,
    deleteInstallation
};