const request = require('supertest');

jest.mock('../../src/config/db', () => ({
    getDB: jest.fn(),
    connectDB: jest.fn().mockResolvedValue({})
}));

const app = require('../../src/app');

describe('API General Endpoints', () => {
    test('GET / debe confirmar que la API está funcionando', async () => {
        const res = await request(app).get('/');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            message: 'Sports Facilities API is running'
        });
    });

    test('GET /sports debe estar accesible', async () => {
        const res = await request(app).get('/sports');
        expect(res.statusCode).toBe(200);
    });

    test('GET /weather-records debe estar accesible', async () => {
        const res = await request(app).get('/weather-records');
        expect(res.statusCode).toBe(200);
    });

    test('GET /api-docs debe devolver la interfaz de Swagger', async () => {
        const res = await request(app).get('/api-docs/');
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('swagger');
    });
});
