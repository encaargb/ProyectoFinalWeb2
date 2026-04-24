const request = require('supertest');
const { ObjectId } = require('mongodb');
const { connectDB, closeDB } = require('../../src/config/db');
const app = require('../../src/app');
require('dotenv').config();

describe('Installation Weather API - Integration Tests', () => {
    let db;
    const testDbName = 'installations_weather_integration_test';
    const originalEnv = process.env;

    beforeAll(async () => {
        process.env = {
            ...originalEnv,
            OPENWEATHER_API_KEY: 'test-key',
            OPENWEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5',
            WEATHER_CACHE_TTL_MINUTES: '60'
        };
        db = await connectDB(testDbName);
    });

    afterAll(async () => {
        if (db) {
            await db.dropDatabase();
        }
        await closeDB();
        process.env = originalEnv;
        delete global.fetch;
    });

    beforeEach(async () => {
        if (db) {
            await db.collection('installations').deleteMany({});
            await db.collection('weather-records').deleteMany({});
        }
        delete global.fetch;
    });

    test('Debe reutilizar el registro vigente más reciente', async () => {
        const installationId = new ObjectId();
        await db.collection('installations').insertOne({
            _id: installationId,
            name: 'Gym',
            type: 'gym',
            city: 'Getafe',
            location: { type: 'Point', coordinates: [-3.7, 40.4] }
        });
        await db.collection('weather-records').insertOne({
            installationId,
            queryDate: new Date(),
            temperature: 21,
            condition: 'cielo claro',
            humidity: 40,
            windspeed: 10,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const res = await request(app).get(`/installations/${installationId.toString()}/weather`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.condition).toBe('cielo claro');
    });

    test('Debe consultar el proveedor y crear registro si el último está caducado', async () => {
        const installationId = new ObjectId();
        await db.collection('installations').insertOne({
            _id: installationId,
            name: 'Gym',
            type: 'gym',
            city: 'Getafe',
            location: { type: 'Point', coordinates: [-3.7, 40.4] }
        });
        await db.collection('weather-records').insertOne({
            installationId,
            queryDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            temperature: 18,
            condition: 'nublado',
            humidity: 50,
            windspeed: 8,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                main: { temp: 24, humidity: 30 },
                weather: [{ description: 'soleado' }],
                wind: { speed: 5 }
            })
        });

        const res = await request(app).get(`/installations/${installationId.toString()}/weather`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.temperature).toBe(24);

        const count = await db.collection('weather-records').countDocuments({ installationId });
        expect(count).toBe(2);
    });

    test('Debe devolver 404 si la instalación no existe', async () => {
        const res = await request(app).get(`/installations/${new ObjectId().toString()}/weather`);
        expect(res.statusCode).toBe(404);
    });

    test('Debe devolver 400 si el id es inválido', async () => {
        const res = await request(app).get('/installations/id-invalido/weather');
        expect(res.statusCode).toBe(400);
    });
});
