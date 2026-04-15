
// Para hacer peticiones a la app: await request(app).get('/installations')
const request = require('supertest');
const app = require('../src/app');
const { ObjectId } = require('mongodb');

// Mock de la base de datos
// La idea es comprobar que mi API responde bien a GET, POST, PUT y DELETE,
// pero sin usar una base de datos real.
// Cuando en el código alguien haga require('../src/config/db'), no uses el módulo real.
// Usa este módulo falso y sustituye la función getDB por una función falsa controlada por jest
jest.mock('../src/config/db', () => ({
    getDB: jest.fn()
}));

const { getDB } = require('../src/config/db');

describe('Installations API', () => {
    // colección falsa de MongoDB.
    let mockCollection;
    // base de datos falsa que, cuando le pides una colección, devuelve mockCollection.
    let mockDb;

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuramos el mock de la colección
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

        // Permitimos que cada test individual pueda definir qué devuelve la "base de datos"
        getDB.mockReturnValue(mockDb);
    });

    describe('GET /installations', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('should return a list of installations', async () => {
            const mockData = [{ _id: new ObjectId(validId), name: 'Test', type: 'gym', city: 'Madrid' }];
            mockCollection.toArray.mockResolvedValue(mockData);

            const res = await request(app).get('/installations');

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(mockDb.collection).toHaveBeenCalledWith('installations');
        });

        test('should return filtered installations by city', async () => {
            mockCollection.toArray.mockResolvedValue([{ city: 'Madrid' }]);

            const res = await request(app).get('/installations?city=Madrid');

            expect(res.statusCode).toBe(200);
            expect(mockCollection.find).toHaveBeenCalledWith(expect.objectContaining({ city: 'Madrid' }));
        });

        test('should return paginated installations', async () => {
            mockCollection.toArray.mockResolvedValue([]);

            await request(app).get('/installations?page=2&limit=5');

            expect(mockCollection.skip).toHaveBeenCalledWith(5);
            expect(mockCollection.limit).toHaveBeenCalledWith(5);
        });
    });

    describe('GET /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('should return one installation when id exists', async () => {
            const mockData = { _id: new ObjectId(validId), name: 'Test' };
            mockCollection.findOne.mockResolvedValue(mockData);

            const res = await request(app).get(`/installations/${validId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.name).toBe('Test');
        });

        test('should return 400 for invalid ID format', async () => {
            const res = await request(app).get('/installations/invalid-id');
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Formato de ID no válido');
        });

        test('should return 404 when installation does not exist', async () => {
            mockCollection.findOne.mockResolvedValue(null);
            const validId = '507f1f77bcf86cd799439011';

            const res = await request(app).get(`/installations/${validId}`);
            expect(res.statusCode).toBe(404);
        });
    });

    describe('POST /installations', () => {
        test('should create a new installation', async () => {
            const newInst = { name: 'New', type: 'gym', city: 'Madrid' };
            mockCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            const res = await request(app).post('/installations').send(newInst);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.name).toBe('New');
            expect(mockCollection.insertOne).toHaveBeenCalled();
        });

        test('should return 400 if required fields are missing', async () => {
            const res = await request(app).post('/installations').send({ name: 'Only Name' });
            expect(res.statusCode).toBe(400);
        });
    });

    describe('PUT /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('should update an existing installation', async () => {
            const updateData = { name: 'Updated', type: 'gym', city: 'Madrid' };
            mockCollection.findOneAndUpdate.mockResolvedValue({ _id: validId, ...updateData });

            const res = await request(app).put(`/installations/${validId}`).send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.name).toBe('Updated');
        });
    });

    describe('DELETE /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('should delete an existing installation', async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const res = await request(app).delete(`/installations/${validId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Installation deleted successfully');
        });

        test('should return 404 if not found', async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

            const res = await request(app).delete(`/installations/${validId}`);
            expect(res.statusCode).toBe(404);
        });
    });
});
