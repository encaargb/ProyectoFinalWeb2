const installations = [
    {
        id: '1',
        name: 'Polideportivo Municipal',
        type: 'polideportivo',
        city: 'Madrid'
    },
    {
        id: '2',
        name: 'Centro Deportivo Norte',
        type: 'gimnasio',
        city: 'Alcobendas'
    }
];

const getAllInstallations = (req, res) => {
    res.status(200).json({ data: installations });
};

const getInstallationById = (req, res) => {
    const { id } = req.params;

    const installation = installations.find((item) => item.id === id);

    if (!installation) {
        return res.status(404).json({
            status: 404,
            message: 'Installation not found'
        });
    }

    return res.status(200).json({ data: installation });
};

module.exports = {
    getAllInstallations,
    getInstallationById
};
