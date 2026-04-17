const request = require('supertest');
const app = require('../src/app');
const { ObjectId } = require('mongodb');

// MOCK DE BASE DE DATOS: Evitamos conexiones reales a MongoDB durante los tests
jest.mock('../src/config/db', () => ({
    getDB: jest.fn()
}));

const { getDB } = require('../src/config/db');

describe('Installations API - Unit Tests', () => {
    let mockCollection;
    let mockDb;

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuración del comportamiento falso de MongoDB
        mockCollection = {
            find: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            toArray: jest.fn(),
            findOne: jest.fn(),
            insertOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            deleteOne: jest.fn()
        };

        mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection)
        };

        getDB.mockReturnValue(mockDb);
    });

    describe('GET /installations', () => {
        const validId = '507f1f77bcf86cd799439011';

        /**
         * PRUEBA: Listado general
         * Verifica que se devuelven todas las instalaciones y que el campo _id se mapea a id
         */
        test('Debe devolver lista de instalaciones con el campo id mapeado', async () => {
            const mockData = [{ _id: new ObjectId(validId), name: 'Test', type: 'gym', city: 'Madrid' }];
            mockCollection.toArray.mockResolvedValue(mockData);

            const res = await request(app).get('/installations');

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].id).toBe(validId); // Comprobamos mapeo
            expect(res.body.data[0]._id).toBeUndefined(); // No debe exponer _id
        });

        /**
         * PRUEBA: Filtros combinados
         * Verifica que el controlador construye bien la consulta de búsqueda
         */
        test('Debe filtrar por ciudad y deporte simultáneamente', async () => {
            mockCollection.toArray.mockResolvedValue([]);

            await request(app).get('/installations?city=Madrid&sport=Tennis');

            expect(mockCollection.find).toHaveBeenCalledWith(expect.objectContaining({
                city: 'Madrid',
                'sports.name': 'Tennis'
            }));
        });

        /**
         * PRUEBA: Paginación
         * Verifica que los parámetros page y limit se calculan correctamente para MongoDB (skip/limit)
         */
        test('Debe aplicar paginación correctamente (skip = (page-1)*limit)', async () => {
            mockCollection.toArray.mockResolvedValue([]);

            await request(app).get('/installations?page=3&limit=10');

            expect(mockCollection.skip).toHaveBeenCalledWith(20); // (3-1)*10
            expect(mockCollection.limit).toHaveBeenCalledWith(10);
        });
    });

    describe('GET /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        /**
         * PRUEBA: Detalle en JSON
         * Caso de éxito estándar
         */
        test('Debe devolver una instalación por su ID en formato JSON (por defecto)', async () => {
            const mockData = { _id: new ObjectId(validId), name: 'Test' };
            mockCollection.findOne.mockResolvedValue(mockData);

            const res = await request(app).get(`/installations/${validId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.id).toBe(validId);
        });

        /**
         * PRUEBA: Detalle en XML (Punto 6.1 de la práctica)
         * Verifica que el servidor negocia el contenido correctamente según la cabecera Accept
         */
        test('Debe devolver la instalación en formato XML si se solicita mediante Accept header', async () => {
            const mockData = { _id: new ObjectId(validId), name: 'Test Installation', city: 'Madrid' };
            mockCollection.findOne.mockResolvedValue(mockData);

            const res = await request(app)
                .get(`/installations/${validId}`)
                .set('Accept', 'application/xml');

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('application/xml');
            expect(res.text).toContain('<name>Test Installation</name>');
            expect(res.text).toContain('<id>' + validId + '</id>');
        });

        /**
         * PRUEBA: Formato de ID inválido
         * Verifica la validación de ObjectId de MongoDB
         */
        test('Debe devolver 400 y ErrorResponse estructurado para un ID no válido', async () => {
            const res = await request(app).get('/installations/esto-no-es-un-id');
            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe(400);
            expect(res.body.message).toBeDefined();
        });
    });

    describe('POST /installations', () => {
        /**
         * PRUEBA: Creación de instalación
         * Verifica que se insertan los datos y se devuelven con el nuevo ID
         */
        test('Debe crear una nueva instalación y devolverla', async () => {
            const newInst = { name: 'New Gym', type: 'gym', city: 'Madrid' };
            const newId = new ObjectId();
            mockCollection.insertOne.mockResolvedValue({ insertedId: newId });

            const res = await request(app).post('/installations').send(newInst);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.id).toBe(newId.toString());
            expect(res.body.data.name).toBe('New Gym');
        });

        /**
         * PRUEBA: Validación de campos obligatorios
         * Verifica que no se permite crear instalaciones sin los campos mínimos
         */
        test('Debe devolver 400 si faltan campos obligatorios (name, type, city)', async () => {
            const res = await request(app).post('/installations').send({ name: 'Solo Nombre' });
            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe(400);
        });
    });

    describe('DELETE /installations/:id', () => {
        const validId = '507f1f77bcf86cd799439011';

        /**
         * PRUEBA: Borrado exitoso
         */
        test('Debe borrar una instalación existente', async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const res = await request(app).delete(`/installations/${validId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(200);
            expect(res.body.message).toContain('deleted');
        });

        /**
         * PRUEBA: Borrado de ID inexistente
         */
        test('Debe devolver 404 si se intenta borrar un ID que no existe', async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

            const res = await request(app).delete(`/installations/${validId}`);
            expect(res.statusCode).toBe(404);
            expect(res.body.status).toBe(404);
        });
    });
});
