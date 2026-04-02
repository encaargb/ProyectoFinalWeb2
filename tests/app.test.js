const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
    test('should return API running message', async () => {
        const res = await request(app).get('/');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            message: 'Sports Facilities API is running'
        });
    });
});
