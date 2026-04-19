jest.mock('mongodb', () => {
    const connect = jest.fn();
    const close = jest.fn();
    const db = jest.fn();

    return {
        MongoClient: jest.fn().mockImplementation(() => ({
            connect,
            close,
            db
        })),
        __mock: {
            connect,
            close,
            db
        }
    };
});

describe('DB config', () => {
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...ORIGINAL_ENV };
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV;
    });

    test('connectDB usa la base de datos de entorno', async () => {
        process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017';
        process.env.MONGODB_DB_NAME = 'main_db';

        const { __mock } = require('mongodb');
        const fakeDb = { collection: jest.fn() };
        __mock.db.mockReturnValue(fakeDb);

        const { connectDB, getDB, closeDB } = require('../../src/config/db');
        const db = await connectDB();

        expect(__mock.connect).toHaveBeenCalled();
        expect(__mock.db).toHaveBeenCalledWith('main_db');
        expect(db).toBe(fakeDb);
        expect(getDB()).toBe(fakeDb);

        await closeDB();
    });

    test('connectDB permite sobrescribir el nombre de la base para tests', async () => {
        process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017';
        process.env.MONGODB_DB_NAME = 'main_db';

        const { __mock } = require('mongodb');
        const fakeDb = { collection: jest.fn() };
        __mock.db.mockReturnValue(fakeDb);

        const { connectDB, closeDB } = require('../../src/config/db');
        await connectDB('test_db');

        expect(__mock.db).toHaveBeenCalledWith('test_db');

        await closeDB();
    });

    test('connectDB falla si falta MONGODB_URI', async () => {
        delete process.env.MONGODB_URI;
        process.env.MONGODB_DB_NAME = 'main_db';

        const { connectDB } = require('../../src/config/db');

        await expect(connectDB()).rejects.toThrow('MONGODB_URI');
    });

    test('connectDB falla si falta el nombre de la base de datos', async () => {
        process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017';
        delete process.env.MONGODB_DB_NAME;

        const { connectDB } = require('../../src/config/db');

        await expect(connectDB()).rejects.toThrow('MONGODB_DB_NAME');
    });

    test('getDB devuelve null si todavía no hay conexión', () => {
        const { getDB } = require('../../src/config/db');
        expect(getDB()).toBeNull();
    });

    test('closeDB resetea la conexión abierta', async () => {
        process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017';
        process.env.MONGODB_DB_NAME = 'main_db';

        const { __mock } = require('mongodb');
        const fakeDb = { collection: jest.fn() };
        __mock.db.mockReturnValue(fakeDb);

        const { connectDB, getDB, closeDB } = require('../../src/config/db');
        await connectDB();
        await closeDB();

        expect(__mock.close).toHaveBeenCalled();
        expect(getDB()).toBeNull();
    });
});
