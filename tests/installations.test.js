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
