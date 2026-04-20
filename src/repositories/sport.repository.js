const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

// Todas las operaciones de deportes pasan por la colección sports.
const getCollection = () => {
    const db = getDB();

    if (!db) {
        throw new Error('La conexión con MongoDB no está inicializada');
    }

    return db.collection('sports');
};

const findAll = async (filter, skip, limit) => {
    return await getCollection()
        .find(filter)
        .skip(skip)
        .limit(limit)
        .toArray();
};

const findById = async (id) => {
    if (!ObjectId.isValid(id)) return null;
    return await getCollection().findOne({ _id: new ObjectId(id) });
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

const update = async (id, data) => {
    if (!ObjectId.isValid(id)) return null;
    const { _id, ...updateData } = data;

    return await getCollection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } },
        { returnDocument: 'after' }
    );
};

const remove = async (id) => {
    if (!ObjectId.isValid(id)) return false;
    const result = await getCollection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
};

module.exports = {
    create,
    findAll,
    findById,
    remove,
    update
};
