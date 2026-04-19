/*
Este archivo es la capa de acceso a datos.

Su trabajo es:

    coger la colección installations
    ejecutar consultas sobre MongoDB
    devolver resultados al controlador

 */

const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// Todas las operaciones pasan por la misma colección.
const getCollection = () => {
    const db = getDB();

    if (!db) {
        throw new Error('La conexión con MongoDB no está inicializada');
    }

    return db.collection('installations');
};

const findAll = async (filter, skip, limit) => {
    // MongoDB aplica filtros, después salta documentos y por último limita resultados.
    return await getCollection()
        .find(filter)
        .skip(skip)
        .limit(limit)
        .toArray();
};

/*
    MongoDB guarda _id como ObjectId, no como string normal.
    Por eso, si te llega "67f..." como texto desde la URL, no puedes buscar así:
    { _id: id } porque eso sería string. Tienes que convertirlo a: { _id: new ObjectId(id) }
*/
const findById = async (id) => {
    if (!ObjectId.isValid(id)) return null;
    return await getCollection().findOne({ _id: new ObjectId(id) });
};

const create = async (data) => {
    // Guardamos timestamps aquí para que el controlador no tenga que conocer ese detalle.
    const createdAt = new Date();
    const updatedAt = new Date();

    const result = await getCollection().insertOne({
        ...data,
        createdAt,
        updatedAt
    });
    return { _id: result.insertedId, ...data, createdAt, updatedAt };
};

const update = async (id, data) => {
    if (!ObjectId.isValid(id)) return null;
    // Nunca se debe intentar cambiar el _id de MongoDB.
    const { _id, ...updateData } = data;
    const result = await getCollection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } },
        { returnDocument: 'after' }
    );
    return result;
};

const remove = async (id) => {
    if (!ObjectId.isValid(id)) return false;
    const result = await getCollection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};
