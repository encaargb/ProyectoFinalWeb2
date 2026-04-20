const request = require('supertest');
const { ObjectId } = require('mongodb');

jest.mock('../../src/config/db', () => ({
    getDB: jest.fn()
}));

const app = require('../../src/app');
const { getDB } = require('../../src/config/db');

describe('Installations API - Unit Tests', () => {
    let mockCollection;
    let mockDb;

    beforeEach(() => {
        jest.clearAllMocks();

        mockCollection = {
            find: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            toArray: jest.fn(),
            findOne: jest.fn(),
            insertOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            deleteOne: jest.fn()
        };

        mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection)
        };

        getDB.mockReturnValue(mockDb);
    });

    describe('GET /installations', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('Debe devolver lista de instalaciones con id mapeado y paginación', async () => {
            const mockData = [{ _id: new ObjectId(validId), name: 'Test', type: 'gym', city: 'Madrid' }];
            mockCollection.toArray.mockResolvedValue(mockData);

            const res = await request(app).get('/installations');

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].id).toBe(validId);
            expect(res.body.data[0]._id).toBeUndefined();
            expect(res.body.pagination).toEqual({ page: 1, limit: 10 });
        });

        test('Debe filtrar por ciudad y deporte simultáneamente', async () => {
            mockCollection.toArray.mockResolvedValue([]);

            await request(app).get('/installations?city=Madrid&sport=Tennis');

            expect(mockCollection.find).toHaveBeenCalledWith({
                city: 'Madrid',
                'sports.name': 'Tennis'
            });
        });

        test('Debe filtrar por nombre con búsqueda parcial sin distinguir mayúsculas', async () => {
            mockCollection.toArray.mockResolvedValue([]);

            await request(app).get('/installations?name=juan');

            expect(mockCollection.find).toHaveBeenCalledWith({
                name: { $regex: 'juan', $options: 'i' }
            });
        });

        test('Debe aplicar paginación correctamente', async () => {
            mockCollection.toArray.mockResolvedValue([]);

            await request(app).get('/installations?page=3&limit=10');

            expect(mockCollection.skip).toHaveBeenCalledWith(20);
            expect(mockCollection.limit).toHaveBeenCalledWith(10);
        });

        test('Debe devolver 400 si page es inválido', async () => {
            const res = await request(app).get('/installations?page=0');

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('page');
        });

        test('Debe devolver 400 si name es vacío', async () => {
            const res = await request(app).get('/installations?name=');

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('name');
        });
    });

    describe('GET /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('Debe devolver una instalación por su ID en JSON', async () => {
            const mockData = { _id: new ObjectId(validId), name: 'Test', type: 'gym', city: 'Madrid' };
            mockCollection.findOne.mockResolvedValue(mockData);

            const res = await request(app).get(`/installations/${validId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.id).toBe(validId);
        });

        test('Debe devolver la instalación en XML si se solicita', async () => {
            const mockData = { _id: new ObjectId(validId), name: 'Test Installation', type: 'gym', city: 'Madrid' };
            mockCollection.findOne.mockResolvedValue(mockData);

            const res = await request(app)
                .get(`/installations/${validId}`)
                .set('Accept', 'application/xml');

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('application/xml');
            expect(res.text).toContain('<name>Test Installation</name>');
            expect(res.text).toContain(`<id>${validId}</id>`);
        });

        test('Debe devolver 500 si la instalación no es exportable a XML', async () => {
            const mockData = { _id: new ObjectId(validId), name: 'Broken XML', city: 'Madrid' };
            mockCollection.findOne.mockResolvedValue(mockData);

            const res = await request(app)
                .get(`/installations/${validId}`)
                .set('Accept', 'application/xml');

            expect(res.statusCode).toBe(500);
            expect(res.body.message).toContain('XML');
        });

        test('Debe devolver 400 para un ID no válido', async () => {
            const res = await request(app).get('/installations/esto-no-es-un-id');
            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe(400);
        });
    });

    describe('POST /installations', () => {
        test('Debe crear una nueva instalación y devolverla', async () => {
            const newInst = { name: 'New Gym', type: 'gym', city: 'Madrid' };
            const newId = new ObjectId();
            mockCollection.insertOne.mockResolvedValue({ insertedId: newId });

            const res = await request(app).post('/installations').send(newInst);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.id).toBe(newId.toString());
            expect(res.body.data.name).toBe('New Gym');
        });

        test('Debe devolver 400 si faltan campos obligatorios', async () => {
            const res = await request(app).post('/installations').send({ name: 'Solo Nombre' });
            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe(400);
        });

        test('Debe devolver 400 si location es inválido', async () => {
            const res = await request(app).post('/installations').send({
                name: 'Gym',
                type: 'gym',
                city: 'Madrid',
                location: { type: 'LineString', coordinates: [] }
            });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('location.type');
        });
    });

    describe('PUT /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('Debe actualizar una instalación existente', async () => {
            const updated = { _id: new ObjectId(validId), name: 'Updated', type: 'gym', city: 'Madrid' };
            mockCollection.findOneAndUpdate.mockResolvedValue(updated);

            const res = await request(app)
                .put(`/installations/${validId}`)
                .send({ name: 'Updated', type: 'gym', city: 'Madrid' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.name).toBe('Updated');
        });

        test('Debe devolver 404 si no existe la instalación a actualizar', async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue(null);

            const res = await request(app)
                .put(`/installations/${validId}`)
                .send({ name: 'Updated', type: 'gym', city: 'Madrid' });

            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('Debe borrar una instalación existente', async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const res = await request(app).delete(`/installations/${validId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(200);
        });

        test('Debe devolver 404 si se intenta borrar un ID que no existe', async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

            const res = await request(app).delete(`/installations/${validId}`);
            expect(res.statusCode).toBe(404);
            expect(res.body.status).toBe(404);
        });
    });
});
