const Installation = require('../models/installation.model');

const getAllInstallations = async (req, res) => {
    const { city, type, sport, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (city) {
        filter.city = city;
    }
    if (type) {
        filter.type = type;
    }
    if (sport) {
        filter['sports.name'] = sport;
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const installations = await Installation.find(filter)
        .skip(skip)
        .limit(limitNumber);

    res.status(200).json({ data: installations });
};

const getInstallationById = async (req, res) => {
    const { id } = req.params;

    const installation = await Installation.findById(id);

    if (!installation) {
        return res.status(404).json({
            status: 404,
            message: 'Installation not found'
        });
    }

    res.status(200).json({ data: installation });
};

const createInstallation = async (req, res) => {
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

    if (!name || !type || !city) {
        return res.status(400).json({
            status: 400,
            message: 'Missing required fields'
        });
    }

    const installation = await Installation.create({
        name,
        type,
        city,
        sports,
        location,
        externalId,
        source,
        lastUpdated
    });

    res.status(201).json({ data: installation });
};


const updateInstallation = async (req, res) => {
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

    if (!name || !type || !city) {
        return res.status(400).json({
            status: 400,
            message: 'Missing required fields'
        });
    }


    const installation = await Installation.findByIdAndUpdate(
        id,
        {
            name,
            type,
            city,
            sports,
            location,
            externalId,
            source,
            lastUpdated
        },
        { new: true }
    );

    if (!installation) {
        return res.status(404).json({
            status: 404,
            message: 'Installation not found'
        });
    }

    res.status(200).json({ data: installation });
};


const deleteInstallation = async (req, res) => {
    const { id } = req.params;

    const installation = await Installation.findByIdAndDelete(id);

    if (!installation) {
        return res.status(404).json({
            status: 404,
            message: 'Installation not found'
        });
    }

    res.status(200).json({
        message: 'Installation deleted successfully'
    });
};

module.exports = {
    getAllInstallations,
    getInstallationById,
    createInstallation,
    updateInstallation,
    deleteInstallation
};
