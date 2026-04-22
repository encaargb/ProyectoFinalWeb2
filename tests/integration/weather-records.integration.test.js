const request = require('supertest');
const { ObjectId } = require('mongodb');
const { connectDB, closeDB } = require('../../src/config/db');
const app = require('../../src/app');
require('dotenv').config();

describe('Weather Records API - Integration Tests', () => {
    let db;
    const testDbName = 'weather_records_integration_test';

    beforeAll(async () => {
        db = await connectDB(testDbName);
    });

    afterAll(async () => {
        if (db) {
            await db.dropDatabase();
        }
        await closeDB();
    });

    beforeEach(async () => {
        if (db) {
            await db.collection('weather-records').deleteMany({});
        }
    });

    test('Debe devolver registros filtrados por installationId', async () => {
        const installationId = new ObjectId();
        await db.collection('weather-records').insertMany([
            {
                installationId,
                queryDate: new Date('2026-04-20T10:00:00.000Z'),
                temperature: 21,
                condition: 'clear sky',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                installationId: new ObjectId(),
                queryDate: new Date('2026-04-21T10:00:00.000Z'),
                temperature: 18,
                condition: 'cloudy',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        const res = await request(app).get(`/weather-records?installationId=${installationId.toString()}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });

    test('Debe filtrar por rango de fechas y condición', async () => {
        await db.collection('weather-records').insertMany([
            {
                installationId: new ObjectId(),
                queryDate: new Date('2026-04-20T10:00:00.000Z'),
                temperature: 21,
                condition: 'clear sky',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                installationId: new ObjectId(),
                queryDate: new Date('2026-04-21T10:00:00.000Z'),
                temperature: 18,
                condition: 'rain',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        const res = await request(app).get('/weather-records?condition=clear&dateFrom=2026-04-20T00:00:00.000Z&dateTo=2026-04-20T23:59:59.999Z');

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].condition).toContain('clear');
    });

    test('Debe aplicar ordenación y paginación', async () => {
        await db.collection('weather-records').insertMany([
            {
                installationId: new ObjectId(),
                queryDate: new Date('2026-04-20T10:00:00.000Z'),
                temperature: 18,
                condition: 'cloudy',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                installationId: new ObjectId(),
                queryDate: new Date('2026-04-21T10:00:00.000Z'),
                temperature: 25,
                condition: 'clear sky',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        const res = await request(app).get('/weather-records?sortBy=temperature&sortOrder=desc&page=1&limit=1');

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].temperature).toBe(25);
    });

    test('Debe devolver un registro por id', async () => {
        const result = await db.collection('weather-records').insertOne({
            installationId: new ObjectId(),
            queryDate: new Date('2026-04-20T10:00:00.000Z'),
            temperature: 21,
            condition: 'clear sky',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const res = await request(app).get(`/weather-records/${result.insertedId.toString()}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.id).toBe(result.insertedId.toString());
    });
});
