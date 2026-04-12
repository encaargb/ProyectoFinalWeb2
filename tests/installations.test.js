const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/models/installation.model', () => ({
    find: jest.fn(),
    findById: jest.fn()
}));

const Installation = require('../src/models/installation.model');


describe('GET /installations', () => {
    test('should return a list of installations', async () => {
        Installation.find.mockResolvedValue([
            { id: '1', name: 'Test', type: 'gym', city: 'Madrid' }
        ]);
        const res = await request(app).get('/installations');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
    });
});

describe('GET /installations/:id', () => {
    test('should return one installation when id exists', async () => {
        Installation.findById.mockResolvedValue({
            id: '1',
            name: 'Test',
            type: 'gym',
            city: 'Madrid'
        });
        const res = await request(app).get('/installations/1');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('id', '1');
        expect(res.body.data).toHaveProperty('name');
        expect(res.body.data).toHaveProperty('type');
        expect(res.body.data).toHaveProperty('city');
    });

    test('should return 404 when installation does not exist', async () => {
        Installation.findById.mockResolvedValue(null);
        const res = await request(app).get('/installations/999');

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            status: 404,
            message: 'Installation not found'
        });
    });
});

