const request = require('supertest');

// Mock de la base de datos para que no intente conectar durante el test de la app
jest.mock('../src/config/db', () => ({
    getDB: jest.fn(),
    connectDB: jest.fn().mockResolvedValue({})
}));

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