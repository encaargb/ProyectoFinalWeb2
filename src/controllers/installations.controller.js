const getAllInstallations = (req, res) => {
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

    res.status(200).json({ data: installations });
};

module.exports = {
    getAllInstallations
};
