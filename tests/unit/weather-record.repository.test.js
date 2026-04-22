const { ObjectId } = require('mongodb');
const weatherRecordRepository = require('../../src/repositories/weather-record.repository');

jest.mock('../../src/config/db', () => ({
    getDB: jest.fn()
}));

const { getDB } = require('../../src/config/db');

describe('Weather Record Repository - Unit Tests', () => {
    let mockCollection;
    let mockDb;

    beforeEach(() => {
        jest.clearAllMocks();

        mockCollection = {
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            toArray: jest.fn(),
            findOne: jest.fn()
        };

        mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection)
        };

        getDB.mockReturnValue(mockDb);
    });

    test('findAll aplica filtro, ordenación y paginación', async () => {
        const mockRecords = [{ _id: new ObjectId(), condition: 'clear sky' }];
        mockCollection.toArray.mockResolvedValue(mockRecords);

        const result = await weatherRecordRepository.findAll({
            filter: { condition: { $regex: 'clear', $options: 'i' } },
            sort: { queryDate: -1 },
            skip: 0,
            limit: 10
        });

        expect(mockDb.collection).toHaveBeenCalledWith('weather-records');
        expect(mockCollection.find).toHaveBeenCalled();
        expect(mockCollection.sort).toHaveBeenCalledWith({ queryDate: -1 });
        expect(result).toEqual(mockRecords);
    });

    test('findById devuelve null si el ID no es válido', async () => {
        const result = await weatherRecordRepository.findById('invalid-id');
        expect(result).toBeNull();
    });
});
