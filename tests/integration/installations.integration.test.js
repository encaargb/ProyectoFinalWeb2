const request = require('supertest');
const { connectDB, closeDB, getDB } = require('../../src/config/db');
const app = require('../../src/app');
require('dotenv').config();

describe('Installations API - INTEGRATION TESTS (End-to-End)', () => {
    let db;
    const testDbName = 'sports_facilities_test';

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
            await db.collection('installations').deleteMany({});
        }
    });

    test('Debe crear una instalación en la DB real y recuperarla por ID', async () => {
        const newInstallation = {
            name: 'Real Integration Gym',
            type: 'polideportivo',
            city: 'Madrid',
            sports: [{ name: 'Fútbol', sportId: '123' }],
            location: { type: 'Point', coordinates: [-3.7, 40.4] }
        };

        const createRes = await request(app)
            .post('/installations')
            .send(newInstallation);

        expect(createRes.statusCode).toBe(201);
        const createdId = createRes.body.data.id;
        expect(createdId).toBeDefined();

        const getRes = await request(app)
            .get(`/installations/${createdId}`);

        expect(getRes.statusCode).toBe(200);
        expect(getRes.body.data.name).toBe(newInstallation.name);
        expect(getRes.body.data.city).toBe('Madrid');
    });

    test('Debe persistir múltiples instalaciones y filtrarlas correctamente', async () => {
        const inst1 = { name: 'Gym Madrid', type: 'gym', city: 'Madrid' };
        const inst2 = { name: 'Gym Barcelona', type: 'gym', city: 'Barcelona' };

        await db.collection('installations').insertMany([inst1, inst2]);

        const res = await request(app).get('/installations?city=Barcelona');

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe('Gym Barcelona');
    });

    test('Debe actualizar los datos en la base de datos real', async () => {
        const inst = { name: 'Old Name', type: 'gym', city: 'Madrid' };
        const result = await db.collection('installations').insertOne(inst);
        const id = result.insertedId.toString();

        const updateData = { name: 'New Name', type: 'gym', city: 'Madrid' };
        const res = await request(app)
            .put(`/installations/${id}`)
            .send(updateData);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.name).toBe('New Name');

        const updatedInDb = await db.collection('installations').findOne({ _id: result.insertedId });
        expect(updatedInDb.name).toBe('New Name');
    });

    test('Debe devolver XML real desde la base de datos cuando se solicita', async () => {
        const inst = { name: 'XML Gym', type: 'gym', city: 'Madrid' };
        const result = await db.collection('installations').insertOne(inst);
        const id = result.insertedId.toString();

        const res = await request(app)
            .get(`/installations/${id}`)
            .set('Accept', 'application/xml');

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('application/xml');
        expect(res.text).toContain('<name>XML Gym</name>');
    });

    test('Debe eliminar el documento de la base de datos real', async () => {
        const inst = { name: 'To be deleted', type: 'gym', city: 'Madrid' };
        const result = await db.collection('installations').insertOne(inst);
        const id = result.insertedId.toString();

        const res = await request(app).delete(`/installations/${id}`);
        expect(res.statusCode).toBe(200);

        const deletedInDb = await db.collection('installations').findOne({ _id: result.insertedId });
        expect(deletedInDb).toBeNull();
    });

    test('Debe devolver 400 si los filtros o la paginación son inválidos', async () => {
        const pageRes = await request(app).get('/installations?page=0');
        const filterRes = await request(app).get('/installations?city=');

        expect(pageRes.statusCode).toBe(400);
        expect(filterRes.statusCode).toBe(400);
    });

    test('Debe devolver 400 si el JSON enviado al crear es inválido', async () => {
        const res = await request(app)
            .post('/installations')
            .send({
                name: 'Gym',
                type: 'gym',
                city: 'Madrid',
                sports: [{ sportId: 'sin-name' }]
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('name');
    });

    test('Debe devolver 400 si el ID es inválido en PUT y DELETE', async () => {
        const updateRes = await request(app)
            .put('/installations/id-invalido')
            .send({ name: 'Gym', type: 'gym', city: 'Madrid' });
        const deleteRes = await request(app).delete('/installations/id-invalido');

        expect(updateRes.statusCode).toBe(400);
        expect(deleteRes.statusCode).toBe(400);
    });
});
