const request = require('supertest');

// MOCK DE BASE DE DATOS: Evita errores de conexión durante el test del servidor
jest.mock('../src/config/db', () => ({
    getDB: jest.fn(),
    connectDB: jest.fn().mockResolvedValue({})
}));

const app = require('../src/app');

describe('API General Endpoints', () => {
    
    /**
     * PRUEBA: Estado de la API
     * Verifica que el endpoint raíz '/' funciona correctamente (según OpenAPI)
     */
    test('GET / debe confirmar que la API está funcionando', async () => {
        const res = await request(app).get('/');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            message: 'Sports Facilities API is running'
        });
    });

    /**
     * PRUEBA: Rutas registradas
     * Verifica que los prefijos de ruta para deportes y clima están configurados
     */
    test('GET /sports debe estar accesible (aunque esté vacío por ahora)', async () => {
        const res = await request(app).get('/sports');
        expect(res.statusCode).not.toBe(404);
    });

    test('GET /weather-records debe estar accesible', async () => {
        const res = await request(app).get('/weather-records');
        expect(res.statusCode).not.toBe(404);
    });

    /**
     * PRUEBA: Documentación Swagger
     * Verifica que la ruta /api-docs sirve el contenido UI de Swagger
     */
    test('GET /api-docs debe devolver la interfaz de Swagger', async () => {
        const res = await request(app).get('/api-docs/');
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('swagger');
    });
});
