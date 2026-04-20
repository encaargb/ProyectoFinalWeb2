const { ObjectId } = require('mongodb');
const sportRepository = require('../../src/repositories/sport.repository');

jest.mock('../../src/config/db', () => ({
    getDB: jest.fn()
}));

const { getDB } = require('../../src/config/db');

describe('Sport Repository - Unit Tests', () => {
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
        const mockSports = [{ _id: new ObjectId(), name: 'tenis' }];
        mockCollection.toArray.mockResolvedValue(mockSports);

        const result = await sportRepository.findAll({ category: null }, 0, 10);

        expect(mockDb.collection).toHaveBeenCalledWith('sports');
        expect(mockCollection.find).toHaveBeenCalledWith({ category: null });
        expect(result).toEqual(mockSports);
    });

    test('findById devuelve null si el ID no es válido', async () => {
        const result = await sportRepository.findById('invalid-id');
        expect(result).toBeNull();
    });

    test('create devuelve el documento creado con timestamps', async () => {
        const insertedId = new ObjectId();
        mockCollection.insertOne.mockResolvedValue({ insertedId });

        const result = await sportRepository.create({ name: 'tenis', category: null, environment: null, osmKey: 'tennis' });

        expect(result).toEqual(expect.objectContaining({
            _id: insertedId,
            name: 'tenis',
            category: null,
            environment: null,
            osmKey: 'tennis',
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
        }));
    });

    test('update devuelve el documento actualizado', async () => {
        const validId = new ObjectId();
        const updatedSport = { _id: validId, name: 'tenis', category: 'racket' };
        mockCollection.findOneAndUpdate.mockResolvedValue(updatedSport);

        const result = await sportRepository.update(validId.toString(), { name: 'tenis', category: 'racket' });

        expect(mockCollection.findOneAndUpdate).toHaveBeenCalled();
        expect(result).toEqual(updatedSport);
    });

    test('remove devuelve true si se borra un deporte', async () => {
        const validId = new ObjectId();
        mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const result = await sportRepository.remove(validId.toString());

        expect(result).toBe(true);
    });
});
