const request = require('supertest');
const app = require('../src/app');

describe('GET /installations', () => {
    test('should return a list of installations', async () => {
        const res = await request(app).get('/installations');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });
});

describe('GET /installations/:id', () => {
    test('should return one installation when id exists', async () => {
        const res = await request(app).get('/installations/1');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('id', '1');
        expect(res.body.data).toHaveProperty('name');
        expect(res.body.data).toHaveProperty('type');
        expect(res.body.data).toHaveProperty('city');
    });

    test('should return 404 when installation does not exist', async () => {
        const res = await request(app).get('/installations/999');

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            status: 404,
            message: 'Installation not found'
        });
    });
});

