const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/models/installation.model', () => ({
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

const Installation = require('../src/models/installation.model');
const mockFindChain = (result) => {
    const limitMock = jest.fn().mockResolvedValue(result);
    const skipMock = jest.fn(() => ({ limit: limitMock }));
    Installation.find.mockReturnValue({ skip: skipMock });

    return { skipMock, limitMock };
};

describe('GET /installations', () => {
    test('should return a list of installations', async () => {
        mockFindChain([
            { id: '1', name: 'Test', type: 'gym', city: 'Madrid' }
        ]);
        const res = await request(app).get('/installations');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('should return filtered installations by city', async () => {
        mockFindChain([
            { id: '1', name: 'Test Madrid', type: 'gym', city: 'Madrid' }
        ]);

        const res = await request(app).get('/installations?city=Madrid');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0]).toHaveProperty('city', 'Madrid');
        expect(Installation.find).toHaveBeenCalledWith({ city: 'Madrid' });
    });

    test('should return filtered installations by type', async () => {
        mockFindChain([
            { id: '1', name: 'Gym Test', type: 'gym', city: 'Madrid' }
        ]);

        const res = await request(app).get('/installations?type=gym');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0]).toHaveProperty('type', 'gym');
        expect(Installation.find).toHaveBeenCalledWith({ type: 'gym' });
    });

    test('should return filtered installations by sport', async () => {
        mockFindChain([
            {
                id: '1',
                name: 'Polideportivo Madrid',
                type: 'polideportivo',
                city: 'Madrid',
                sports: [
                    { sportId: '507f1f77bcf86cd799439011', name: 'Baloncesto' }
                ]
            }
        ]);

        const res = await request(app).get('/installations?sport=Baloncesto');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0]).toHaveProperty('sports');
        expect(Installation.find).toHaveBeenCalledWith({ 'sports.name': 'Baloncesto' });
    });

    test('should return filtered installations by city, type and sport', async () => {
        mockFindChain([
            {
                id: '1',
                name: 'Polideportivo Madrid',
                type: 'polideportivo',
                city: 'Madrid',
                sports: [
                    { sportId: '507f1f77bcf86cd799439011', name: 'Baloncesto' }
                ]
            }
        ]);

        const res = await request(app).get('/installations?city=Madrid&type=polideportivo&sport=Baloncesto');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0]).toHaveProperty('city', 'Madrid');
        expect(res.body.data[0]).toHaveProperty('type', 'polideportivo');
        expect(Installation.find).toHaveBeenCalledWith({
            city: 'Madrid',
            type: 'polideportivo',
            'sports.name': 'Baloncesto'
        });
    });

    test('should return paginated installations', async () => {
        const mockInstallations = [
            { id: '1', name: 'Installation 1', type: 'gym', city: 'Madrid' },
            { id: '2', name: 'Installation 2', type: 'pool', city: 'Madrid' }
        ];

        const limitMock = jest.fn().mockResolvedValue(mockInstallations);
        const skipMock = jest.fn(() => ({ limit: limitMock }));

        Installation.find.mockReturnValue({ skip: skipMock });

        const res = await request(app).get('/installations?page=1&limit=2');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.length).toBe(2);
        expect(Installation.find).toHaveBeenCalledWith({});
        expect(skipMock).toHaveBeenCalledWith(0);
        expect(limitMock).toHaveBeenCalledWith(2);
    });

    test('should return filtered and paginated installations', async () => {
        const mockInstallations = [
            {
                id: '1',
                name: 'Polideportivo Madrid',
                type: 'polideportivo',
                city: 'Madrid',
                sports: [
                    { sportId: '507f1f77bcf86cd799439011', name: 'Baloncesto' }
                ]
            }
        ];

        const limitMock = jest.fn().mockResolvedValue(mockInstallations);
        const skipMock = jest.fn(() => ({ limit: limitMock }));

        Installation.find.mockReturnValue({ skip: skipMock });

        const res = await request(app).get(
            '/installations?city=Madrid&type=polideportivo&sport=Baloncesto&page=2&limit=1'
        );

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.length).toBe(1);

        expect(Installation.find).toHaveBeenCalledWith({
            city: 'Madrid',
            type: 'polideportivo',
            'sports.name': 'Baloncesto'
        });

        expect(skipMock).toHaveBeenCalledWith(1);
        expect(limitMock).toHaveBeenCalledWith(1);
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

describe('POST /installations', () => {

    test('should create a new installation', async () => {

        const newInstallation = {
            name: 'Nuevo Polideportivo',
            type: 'polideportivo',
            city: 'Madrid'
        };

        Installation.create.mockResolvedValue({
            id: '123',
            ...newInstallation
        });

        const res = await request(app)
            .post('/installations')
            .send(newInstallation);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('name', 'Nuevo Polideportivo');
    });

    test('should return 400 if required fields are missing', async () => {

        const res = await request(app)
            .post('/installations')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            status: 400,
            message: 'Missing required fields'
        });
    });

});

describe('PUT /installations/:id', () => {

    test('should update an existing installation', async () => {
        const updatedInstallation = {
            name: 'Centro Deportivo Actualizado',
            type: 'gym',
            city: 'Barcelona'
        };

        Installation.findByIdAndUpdate.mockResolvedValue({
            id: '1',
            ...updatedInstallation
        });

        const res = await request(app)
            .put('/installations/1')
            .send(updatedInstallation);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('name', 'Centro Deportivo Actualizado');
        expect(res.body.data).toHaveProperty('city', 'Barcelona');
    });

    test('should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .put('/installations/1')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            status: 400,
            message: 'Missing required fields'
        });
    });

    test('should return 404 if installation does not exist', async () => {
        Installation.findByIdAndUpdate.mockResolvedValue(null);

        const res = await request(app)
            .put('/installations/999')
            .send({
                name: 'Centro Deportivo',
                type: 'gym',
                city: 'Madrid'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            status: 404,
            message: 'Installation not found'
        });
    });
});

describe('DELETE /installations/:id', () => {

    test('should delete an existing installation', async () => {
        Installation.findByIdAndDelete.mockResolvedValue({
            id: '1',
            name: 'Test',
            type: 'gym',
            city: 'Madrid'
        });

        const res = await request(app).delete('/installations/1');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            message: 'Installation deleted successfully'
        });
    });

    test('should return 404 if installation does not exist', async () => {
        Installation.findByIdAndDelete.mockResolvedValue(null);

        const res = await request(app).delete('/installations/999');

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            status: 404,
            message: 'Installation not found'
        });
    });

});

