const request = require('supertest');
const { ObjectId } = require('mongodb');

jest.mock('../../src/config/db', () => ({
    getDB: jest.fn()
}));

const app = require('../../src/app');
const { getDB } = require('../../src/config/db');

describe('Installations API - Unit Tests', () => {
    let mockInstallationsCollection;
    let mockWeatherCollection;
    let mockDb;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInstallationsCollection = {
            find: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            toArray: jest.fn(),
            findOne: jest.fn(),
            insertOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            deleteOne: jest.fn()
        };

        mockWeatherCollection = {
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            toArray: jest.fn(),
            findOne: jest.fn(),
            insertOne: jest.fn()
        };

        mockDb = {
            collection: jest.fn((name) => {
                if (name === 'weather-records') {
                    return mockWeatherCollection;
                }

                return mockInstallationsCollection;
            })
        };

        getDB.mockReturnValue(mockDb);
    });

    describe('GET /installations', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('Debe devolver lista de instalaciones con id mapeado y paginación', async () => {
            const mockData = [{ _id: new ObjectId(validId), name: 'Test', type: 'gym', city: 'Madrid' }];
            mockInstallationsCollection.toArray.mockResolvedValue(mockData);

            const res = await request(app).get('/installations');

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].id).toBe(validId);
            expect(res.body.data[0]._id).toBeUndefined();
            expect(res.body.pagination).toEqual({ page: 1, limit: 10 });
        });

        test('Debe filtrar por ciudad y deporte simultáneamente', async () => {
            mockInstallationsCollection.toArray.mockResolvedValue([]);

            await request(app).get('/installations?city=Madrid&sport=Tennis');

            expect(mockInstallationsCollection.find).toHaveBeenCalledWith({
                city: 'Madrid',
                'sports.name': 'Tennis'
            });
        });

        test('Debe filtrar por nombre con búsqueda parcial sin distinguir mayúsculas', async () => {
            mockInstallationsCollection.toArray.mockResolvedValue([]);

            await request(app).get('/installations?name=juan');

            expect(mockInstallationsCollection.find).toHaveBeenCalledWith({
                name: { $regex: 'juan', $options: 'i' }
            });
        });

        test('Debe aplicar paginación correctamente', async () => {
            mockInstallationsCollection.toArray.mockResolvedValue([]);

            await request(app).get('/installations?page=3&limit=10');

            expect(mockInstallationsCollection.skip).toHaveBeenCalledWith(20);
            expect(mockInstallationsCollection.limit).toHaveBeenCalledWith(10);
        });

        test('Debe devolver 400 si page es inválido', async () => {
            const res = await request(app).get('/installations?page=0');

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('page');
        });

        test('Debe devolver 400 si name es vacío', async () => {
            const res = await request(app).get('/installations?name=');

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('name');
        });
    });

    describe('GET /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('Debe devolver una instalación por su ID en JSON', async () => {
            const mockData = { _id: new ObjectId(validId), name: 'Test', type: 'gym', city: 'Madrid' };
            mockInstallationsCollection.findOne.mockResolvedValue(mockData);

            const res = await request(app).get(`/installations/${validId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.id).toBe(validId);
        });

        test('Debe devolver la instalación en XML si se solicita', async () => {
            const mockData = { _id: new ObjectId(validId), name: 'Test Installation', type: 'gym', city: 'Madrid' };
            mockInstallationsCollection.findOne.mockResolvedValue(mockData);

            const res = await request(app)
                .get(`/installations/${validId}`)
                .set('Accept', 'application/xml');

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('application/xml');
            expect(res.text).toContain('<name>Test Installation</name>');
            expect(res.text).toContain(`<id>${validId}</id>`);
        });

        test('Debe devolver 500 si la instalación no es exportable a XML', async () => {
            const mockData = { _id: new ObjectId(validId), name: 'Broken XML', city: 'Madrid' };
            mockInstallationsCollection.findOne.mockResolvedValue(mockData);

            const res = await request(app)
                .get(`/installations/${validId}`)
                .set('Accept', 'application/xml');

            expect(res.statusCode).toBe(500);
            expect(res.body.message).toContain('XML');
        });

        test('Debe devolver 400 para un ID no válido', async () => {
            const res = await request(app).get('/installations/esto-no-es-un-id');
            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe(400);
        });
    });

    describe('GET /installations/:id/weather', () => {
        const validId = '507f1f77bcf86cd799439011';
        const originalEnv = process.env;

        beforeEach(() => {
            process.env = {
                ...originalEnv,
                OPENWEATHER_API_KEY: 'test-key',
                OPENWEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5',
                WEATHER_CACHE_TTL_MINUTES: '60'
            };
        });

        afterEach(() => {
            process.env = originalEnv;
            delete global.fetch;
        });

        test('Debe devolver el weather-record en caché si sigue vigente', async () => {
            mockInstallationsCollection.findOne.mockResolvedValue({
                _id: new ObjectId(validId),
                name: 'Gym',
                type: 'gym',
                city: 'Madrid',
                location: { type: 'Point', coordinates: [-3.7, 40.4] }
            });
            mockWeatherCollection.findOne.mockResolvedValue({
                _id: new ObjectId(),
                installationId: new ObjectId(validId),
                queryDate: new Date(),
                temperature: 21,
                condition: 'cielo claro',
                humidity: 40,
                windspeed: 10
            });

            const res = await request(app).get(`/installations/${validId}/weather`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.condition).toBe('cielo claro');
        });

        test('Debe consultar el proveedor y crear registro si no hay caché', async () => {
            const createdWeatherId = new ObjectId();
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    main: { temp: 22, humidity: 45 },
                    weather: [{ description: 'soleado' }],
                    wind: { speed: 5 }
                })
            });

            mockInstallationsCollection.findOne.mockResolvedValue({
                _id: new ObjectId(validId),
                name: 'Gym',
                type: 'gym',
                city: 'Madrid',
                location: { type: 'Point', coordinates: [-3.7, 40.4] }
            });
            mockWeatherCollection.findOne.mockResolvedValue(null);
            mockWeatherCollection.insertOne.mockResolvedValue({ insertedId: createdWeatherId });

            const res = await request(app).get(`/installations/${validId}/weather`);

            expect(res.statusCode).toBe(200);
            expect(global.fetch).toHaveBeenCalled();
            expect(res.body.data.id).toBe(createdWeatherId.toString());
            expect(res.body.data.temperature).toBe(22);
        });

        test('Debe devolver 404 si la instalación no existe', async () => {
            mockInstallationsCollection.findOne.mockResolvedValue(null);

            const res = await request(app).get(`/installations/${validId}/weather`);

            expect(res.statusCode).toBe(404);
        });

        test('Debe devolver 400 si la instalación no tiene coordenadas válidas', async () => {
            mockInstallationsCollection.findOne.mockResolvedValue({
                _id: new ObjectId(validId),
                name: 'Gym',
                type: 'gym',
                city: 'Madrid',
                location: { type: 'Point', coordinates: [] }
            });

            const res = await request(app).get(`/installations/${validId}/weather`);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('coordenadas');
        });

        test('Debe devolver 502 si falla el proveedor externo', async () => {
            global.fetch = jest.fn().mockResolvedValue({ ok: false });
            mockInstallationsCollection.findOne.mockResolvedValue({
                _id: new ObjectId(validId),
                name: 'Gym',
                type: 'gym',
                city: 'Madrid',
                location: { type: 'Point', coordinates: [-3.7, 40.4] }
            });
            mockWeatherCollection.findOne.mockResolvedValue(null);

            const res = await request(app).get(`/installations/${validId}/weather`);

            expect(res.statusCode).toBe(502);
        });

        test('Debe devolver 500 si falta la configuración de OpenWeather', async () => {
            delete process.env.OPENWEATHER_API_KEY;
            mockInstallationsCollection.findOne.mockResolvedValue({
                _id: new ObjectId(validId),
                name: 'Gym',
                type: 'gym',
                city: 'Madrid',
                location: { type: 'Point', coordinates: [-3.7, 40.4] }
            });
            mockWeatherCollection.findOne.mockResolvedValue(null);

            const res = await request(app).get(`/installations/${validId}/weather`);

            expect(res.statusCode).toBe(500);
        });
    });

    describe('POST /installations', () => {
        test('Debe crear una nueva instalación y devolverla', async () => {
            const newInst = { name: 'New Gym', type: 'gym', city: 'Madrid' };
            const newId = new ObjectId();
            mockInstallationsCollection.insertOne.mockResolvedValue({ insertedId: newId });

            const res = await request(app).post('/installations').send(newInst);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.id).toBe(newId.toString());
            expect(res.body.data.name).toBe('New Gym');
        });

        test('Debe devolver 400 si faltan campos obligatorios', async () => {
            const res = await request(app).post('/installations').send({ name: 'Solo Nombre' });
            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe(400);
        });

        test('Debe devolver 400 si location es inválido', async () => {
            const res = await request(app).post('/installations').send({
                name: 'Gym',
                type: 'gym',
                city: 'Madrid',
                location: { type: 'LineString', coordinates: [] }
            });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('location.type');
        });
    });

    describe('PUT /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('Debe actualizar una instalación existente', async () => {
            const updated = { _id: new ObjectId(validId), name: 'Updated', type: 'gym', city: 'Madrid' };
            mockInstallationsCollection.findOneAndUpdate.mockResolvedValue(updated);

            const res = await request(app)
                .put(`/installations/${validId}`)
                .send({ name: 'Updated', type: 'gym', city: 'Madrid' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.name).toBe('Updated');
        });

        test('Debe devolver 404 si no existe la instalación a actualizar', async () => {
            mockInstallationsCollection.findOneAndUpdate.mockResolvedValue(null);

            const res = await request(app)
                .put(`/installations/${validId}`)
                .send({ name: 'Updated', type: 'gym', city: 'Madrid' });

            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        test('Debe borrar una instalación existente', async () => {
            mockInstallationsCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const res = await request(app).delete(`/installations/${validId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(200);
        });

        test('Debe devolver 404 si se intenta borrar un ID que no existe', async () => {
            mockInstallationsCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

            const res = await request(app).delete(`/installations/${validId}`);
            expect(res.statusCode).toBe(404);
            expect(res.body.status).toBe(404);
        });
    });
});
