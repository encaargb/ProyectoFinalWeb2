const request = require('supertest');
const { connectDB, closeDB } = require('../../src/config/db');
const app = require('../../src/app');
require('dotenv').config();

describe('Sports API - Integration Tests', () => {
    let db;
    const testDbName = 'sports_api_integration_test';

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
            await db.collection('sports').deleteMany({});
        }
    });

    test('Debe crear y recuperar un deporte por ID', async () => {
        const createRes = await request(app)
            .post('/sports')
            .send({ name: 'tenis', osmKey: 'tennis', category: null, environment: null });

        expect(createRes.statusCode).toBe(201);

        const getRes = await request(app).get(`/sports/${createRes.body.data.id}`);

        expect(getRes.statusCode).toBe(200);
        expect(getRes.body.data.name).toBe('tenis');
    });

    test('Debe filtrar deportes incompletos con missingMetadata=true', async () => {
        await db.collection('sports').insertMany([
            { name: 'tenis', osmKey: 'tennis', category: null, environment: null, createdAt: new Date(), updatedAt: new Date() },
            { name: 'natacion', osmKey: 'swimming', category: 'water', environment: 'indoor', createdAt: new Date(), updatedAt: new Date() }
        ]);

        const res = await request(app).get('/sports?missingMetadata=true');

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe('tenis');
    });

    test('Debe actualizar parcialmente un deporte', async () => {
        const insertResult = await db.collection('sports').insertOne({
            name: 'tenis',
            osmKey: 'tennis',
            category: null,
            environment: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const res = await request(app)
            .patch(`/sports/${insertResult.insertedId.toString()}`)
            .send({ category: 'racket' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.category).toBe('racket');
    });
});
