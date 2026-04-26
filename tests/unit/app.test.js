const request = require('supertest');

jest.mock('../../src/config/db', () => ({
    getDB: jest.fn(() => ({
        collection: jest.fn(() => ({
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            toArray: jest.fn().mockResolvedValue([])
        }))
    })),
    connectDB: jest.fn().mockResolvedValue({})
}));

const app = require('../../src/app');

describe('API General Endpoints', () => {
    test('GET / debe confirmar que la API está funcionando', async () => {
        const res = await request(app).get('/');

        expect(res.statusCode).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
        expect(res.body).toEqual({
            message: 'Sports Facilities API is running'
        });
    });

    test('OPTIONS / debe responder correctamente a la preflight de CORS', async () => {
        const res = await request(app).options('/installations');

        expect(res.statusCode).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
        expect(res.headers['access-control-allow-methods']).toContain('GET');
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
