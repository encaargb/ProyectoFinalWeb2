/*
Este archivo es la capa de acceso a datos.

Su trabajo es:

    coger la colección installations
    ejecutar consultas sobre MongoDB
    devolver resultados al controlador

 */

const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const getCollection = () => getDB().collection('installations');

const findAll = async (filter, skip, limit) => {
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
    const result = await getCollection().insertOne({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    return { _id: result.insertedId, ...data };
};

const update = async (id, data) => {
    if (!ObjectId.isValid(id)) return null;
    delete data._id; // Evitar error de MongoDB si se intenta actualizar el ID
    const result = await getCollection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
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
