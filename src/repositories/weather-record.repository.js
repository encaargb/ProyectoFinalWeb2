const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// La colección weather-records guarda histórico meteorológico asociado a instalaciones.
const getCollection = () => {
    const db = getDB();

    if (!db) {
        throw new Error('La conexión con MongoDB no está inicializada');
    }

    return db.collection('weather-records');
};

// El listado usa un único pipeline sencillo: filtro, orden, salto y límite.
const findAll = async ({ filter, sort, skip, limit }) => {
    return await getCollection()
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
};

// El detalle busca directamente por _id porque es la forma más eficiente y clara.
const findById = async (id) => {
    if (!ObjectId.isValid(id)) return null;
    return await getCollection().findOne({ _id: new ObjectId(id) });
};

module.exports = {
    findAll,
    findById
};
