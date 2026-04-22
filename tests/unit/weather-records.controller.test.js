const request = require('supertest');
const { ObjectId } = require('mongodb');

jest.mock('../../src/config/db', () => ({
    getDB: jest.fn()
}));

const app = require('../../src/app');
const { getDB } = require('../../src/config/db');

describe('Weather Records API - Unit Tests', () => {
    let mockCollection;
    let mockDb;

    beforeEach(() => {
        jest.clearAllMocks();

        mockCollection = {
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            toArray: jest.fn(),
            findOne: jest.fn()
        };

        mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection)
        };

        getDB.mockReturnValue(mockDb);
    });

    test('GET /weather-records devuelve lista paginada y ordenada', async () => {
        const validId = new ObjectId();
        mockCollection.toArray.mockResolvedValue([{
            _id: validId,
            installationId: new ObjectId(),
            queryDate: new Date('2026-04-20T10:00:00.000Z'),
            temperature: 21,
            condition: 'clear sky'
        }]);

        const res = await request(app).get('/weather-records');

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.pagination).toEqual({ page: 1, limit: 10 });
        expect(res.body.sorting).toEqual({ queryDate: -1 });
    });

    test('GET /weather-records filtra por installationId', async () => {
        const installationId = new ObjectId().toString();
        mockCollection.toArray.mockResolvedValue([]);

        await request(app).get(`/weather-records?installationId=${installationId}`);

        expect(mockCollection.find).toHaveBeenCalledWith({
            installationId: new ObjectId(installationId)
        });
    });

    test('GET /weather-records devuelve 400 si sortOrder es inválido', async () => {
        const res = await request(app).get('/weather-records?sortOrder=down');

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('sortOrder');
    });

    test('GET /weather-records/:id devuelve un registro', async () => {
        const validId = '507f1f77bcf86cd799439011';
        mockCollection.findOne.mockResolvedValue({
            _id: new ObjectId(validId),
            installationId: new ObjectId(),
            queryDate: new Date('2026-04-20T10:00:00.000Z'),
            temperature: 21,
            condition: 'clear sky'
        });

        const res = await request(app).get(`/weather-records/${validId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.id).toBe(validId);
    });

    test('GET /weather-records/:id devuelve 400 para un ID inválido', async () => {
        const res = await request(app).get('/weather-records/id-invalido');

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('ID');
    });
});
