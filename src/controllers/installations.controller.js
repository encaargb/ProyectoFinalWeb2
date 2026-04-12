const Installation = require('../models/installation.model');

const getAllInstallations = async (req, res) => {
    const installations = await Installation.find();

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
    const { name, type, city } = req.body;

    if (!name || !type || !city) {
        return res.status(400).json({
            status: 400,
            message: 'Missing required fields'
        });
    }

    const installation = await Installation.create({
        name,
        type,
        city
    });

    res.status(201).json({ data: installation });
};

const updateInstallation = async (req, res) => {
    const { id } = req.params;
    const { name, type, city } = req.body;

    if (!name || !type || !city) {
        return res.status(400).json({
            status: 400,
            message: 'Missing required fields'
        });
    }

    const installation = await Installation.findByIdAndUpdate(
        id,
        { name, type, city },
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
