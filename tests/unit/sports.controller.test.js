const request = require('supertest');
const { ObjectId } = require('mongodb');

jest.mock('../../src/config/db', () => ({
    getDB: jest.fn()
}));

const app = require('../../src/app');
const { getDB } = require('../../src/config/db');

describe('Sports API - Unit Tests', () => {
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

    test('GET /sports devuelve lista paginada', async () => {
        const validId = new ObjectId();
        mockCollection.toArray.mockResolvedValue([{ _id: validId, name: 'tenis', category: null, environment: null, osmKey: 'tennis' }]);

        const res = await request(app).get('/sports');

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.pagination).toEqual({ page: 1, limit: 10 });
    });

    test('GET /sports filtra missingMetadata=true', async () => {
        mockCollection.toArray.mockResolvedValue([]);

        await request(app).get('/sports?missingMetadata=true');

        expect(mockCollection.find).toHaveBeenCalledWith({
            $or: [
                { category: null },
                { environment: null }
            ]
        });
    });

    test('GET /sports/:id devuelve un deporte', async () => {
        const validId = '507f1f77bcf86cd799439011';
        mockCollection.findOne.mockResolvedValue({
            _id: new ObjectId(validId),
            name: 'tenis',
            category: null,
            environment: null,
            osmKey: 'tennis'
        });

        const res = await request(app).get(`/sports/${validId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.id).toBe(validId);
    });

    test('POST /sports crea un deporte', async () => {
        const newId = new ObjectId();
        mockCollection.insertOne.mockResolvedValue({ insertedId: newId });

        const res = await request(app)
            .post('/sports')
            .send({ name: 'tenis', osmKey: 'tennis', category: null, environment: null });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.id).toBe(newId.toString());
    });

    test('PUT /sports/:id actualiza un deporte', async () => {
        const validId = '507f1f77bcf86cd799439011';
        mockCollection.findOneAndUpdate.mockResolvedValue({
            _id: new ObjectId(validId),
            name: 'tenis',
            osmKey: 'tennis',
            category: 'racket',
            environment: 'outdoor'
        });

        const res = await request(app)
            .put(`/sports/${validId}`)
            .send({ name: 'tenis', osmKey: 'tennis', category: 'racket', environment: 'outdoor' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.category).toBe('racket');
    });

    test('PATCH /sports/:id actualiza parcialmente un deporte', async () => {
        const validId = '507f1f77bcf86cd799439011';
        mockCollection.findOneAndUpdate.mockResolvedValue({
            _id: new ObjectId(validId),
            name: 'tenis',
            osmKey: 'tennis',
            category: 'racket',
            environment: null
        });

        const res = await request(app)
            .patch(`/sports/${validId}`)
            .send({ category: 'racket' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.category).toBe('racket');
    });

    test('DELETE /sports/:id elimina un deporte', async () => {
        const validId = '507f1f77bcf86cd799439011';
        mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const res = await request(app).delete(`/sports/${validId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('eliminado');
    });
});
