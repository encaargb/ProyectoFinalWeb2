const { ObjectId } = require('mongodb');
const installationRepository = require('../../src/repositories/installation.repository');

jest.mock('../../src/config/db', () => ({
    getDB: jest.fn()
}));

const { getDB } = require('../../src/config/db');

describe('Installation Repository - Unit Tests', () => {
    let mockCollection;
    let mockDb;

    beforeEach(() => {
        jest.clearAllMocks();

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

    test('findAll debe llamar a find, skip, limit y toArray', async () => {
        const mockInstallations = [{ _id: new ObjectId(), name: 'Gym 1' }];
        mockCollection.toArray.mockResolvedValue(mockInstallations);

        const result = await installationRepository.findAll({ city: 'Madrid' }, 0, 10);

        expect(mockDb.collection).toHaveBeenCalledWith('installations');
        expect(mockCollection.find).toHaveBeenCalledWith({ city: 'Madrid' });
        expect(mockCollection.skip).toHaveBeenCalledWith(0);
        expect(mockCollection.limit).toHaveBeenCalledWith(10);
        expect(result).toEqual(mockInstallations);
    });

    test('findById debe devolver null si el ID no es válido', async () => {
        const result = await installationRepository.findById('invalid-id');
        expect(result).toBeNull();
    });

    test('create debe devolver el documento creado con timestamps', async () => {
        const insertedId = new ObjectId();
        mockCollection.insertOne.mockResolvedValue({ insertedId });

        const result = await installationRepository.create({ name: 'New Gym', type: 'gym', city: 'Madrid' });

        expect(result).toEqual(expect.objectContaining({
            _id: insertedId,
            name: 'New Gym',
            type: 'gym',
            city: 'Madrid',
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
        }));
    });

    test('update debe llamar a findOneAndUpdate y devolver el documento actualizado', async () => {
        const validId = new ObjectId();
        const updatedInstallation = { _id: validId, name: 'Updated Gym', type: 'gym', city: 'Valencia' };
        mockCollection.findOneAndUpdate.mockResolvedValue(updatedInstallation);

        const result = await installationRepository.update(validId.toString(), { name: 'Updated Gym', type: 'gym', city: 'Valencia' });

        expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: validId },
            { $set: expect.objectContaining({
                name: 'Updated Gym',
                type: 'gym',
                city: 'Valencia',
                updatedAt: expect.any(Date)
            }) },
            { returnDocument: 'after' }
        );
        expect(result).toEqual(updatedInstallation);
    });

    test('remove debe devolver true si se borra una instalación', async () => {
        const validId = new ObjectId();
        mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const result = await installationRepository.remove(validId.toString());

        expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: validId });
        expect(result).toBe(true);
    });

    test('debe fallar si no hay conexión inicializada', async () => {
        getDB.mockReturnValue(null);

        await expect(installationRepository.findAll({}, 0, 10)).rejects.toThrow('MongoDB');
    });
});
