const request = require('supertest');
const { connectDB, closeDB, getDB } = require('../../src/config/db');
const app = require('../../src/app');
require('dotenv').config();

describe('Installations API - INTEGRATION TESTS (End-to-End)', () => {
    let db;
    const testDbName = 'sports_facilities_test'; // Nombre de la DB para tests reales

    beforeAll(async () => {
        // Conexión real a la DB de test
        db = await connectDB(testDbName);
    });

    afterAll(async () => {
        // Limpiar la DB de test después de todos los tests y cerrar conexión
        if (db) {
            await db.dropDatabase();
        }
        await closeDB();
    });

    beforeEach(async () => {
        // Limpiar la colección antes de cada test para tener un estado predecible
        if (db) {
            await db.collection('installations').deleteMany({});
        }
    });

    /**
     * PRUEBA: Flujo completo de creación y recuperación
     */
    test('Debe crear una instalación en la DB real y recuperarla por ID', async () => {
        const newInstallation = {
            name: 'Real Integration Gym',
            type: 'polideportivo',
            city: 'Madrid',
            sports: [{ name: 'Fútbol', sportId: '123' }],
            location: { type: 'Point', coordinates: [-3.7, 40.4] }
        };

        // 1. Crear vía POST
        const createRes = await request(app)
            .post('/installations')
            .send(newInstallation);

        expect(createRes.statusCode).toBe(201);
        const createdId = createRes.body.data.id;
        expect(createdId).toBeDefined();

        // 2. Recuperar vía GET :id
        const getRes = await request(app)
            .get(`/installations/${createdId}`);

        expect(getRes.statusCode).toBe(200);
        expect(getRes.body.data.name).toBe(newInstallation.name);
        expect(getRes.body.data.city).toBe('Madrid');
    });

    /**
     * PRUEBA: Listado y filtrado real
     */
    test('Debe persistir múltiples instalaciones y filtrarlas correctamente', async () => {
        const inst1 = { name: 'Gym Madrid', type: 'gym', city: 'Madrid' };
        const inst2 = { name: 'Gym Barcelona', type: 'gym', city: 'Barcelona' };

        await db.collection('installations').insertMany([inst1, inst2]);

        const res = await request(app).get('/installations?city=Barcelona');

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe('Gym Barcelona');
    });

    /**
     * PRUEBA: Actualización real
     */
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

        // Verificar en DB directamente
        const updatedInDb = await db.collection('installations').findOne({ _id: result.insertedId });
        expect(updatedInDb.name).toBe('New Name');
    });

    /**
     * PRUEBA: Negociación de contenido XML en flujo real
     */
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

    /**
     * PRUEBA: Borrado real
     */
    test('Debe eliminar el documento de la base de datos real', async () => {
        const inst = { name: 'To be deleted', type: 'gym', city: 'Madrid' };
        const result = await db.collection('installations').insertOne(inst);
        const id = result.insertedId.toString();

        const res = await request(app).delete(`/installations/${id}`);
        expect(res.statusCode).toBe(200);

        // Verificar que ya no existe
        const deletedInDb = await db.collection('installations').findOne({ _id: result.insertedId });
        expect(deletedInDb).toBeNull();
    });
});
