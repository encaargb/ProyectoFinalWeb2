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

module.exports = {
    getAllInstallations,
    getInstallationById
};
