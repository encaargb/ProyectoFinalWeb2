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

// Para resolver caché buscamos el registro más reciente de una instalación.
const findLatestByInstallationId = async (installationId) => {
    return await getCollection().findOne(
        { installationId: new ObjectId(installationId) },
        { sort: { queryDate: -1 } }
    );
};

const create = async (data) => {
    const createdAt = new Date();
    const updatedAt = new Date();

    const result = await getCollection().insertOne({
        ...data,
        createdAt,
        updatedAt
    });

    return { _id: result.insertedId, ...data, createdAt, updatedAt };
};

module.exports = {
    create,
    findAll,
    findById,
    findLatestByInstallationId
};
