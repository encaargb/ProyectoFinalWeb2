const { ObjectId } = require('mongodb');
const installationRepository = require('../../src/repositories/installation.repository');

// Mock de la conexión a la base de datos
jest.mock('../../src/config/db', () => ({
    getDB: jest.fn()
}));

const { getDB } = require('../../src/config/db');

describe('Installation Repository - Unit Tests', () => {
    let mockCollection;
    let mockDb;

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuración del mock de la colección de MongoDB
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

        // Configuración del mock de la base de datos
        mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection)
        };

        // Aseguramos que getDB siempre devuelva nuestra base de datos mockeada
        getDB.mockReturnValue(mockDb);
    });

    describe('findAll', () => {
        // Prueba: Verificar que findAll llama a find, skip, limit y toArray
        test('Debe llamar a find, skip, limit y toArray en la colección', async () => {
            const mockInstallations = [{ _id: new ObjectId(), name: 'Gym 1' }];
            mockCollection.toArray.mockResolvedValue(mockInstallations);

            const filter = { city: 'Madrid' };
            const skip = 0;
            const limit = 10;
            const result = await installationRepository.findAll(filter, skip, limit);

            expect(getDB).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('installations');
            expect(mockCollection.find).toHaveBeenCalledWith(filter);
            expect(mockCollection.skip).toHaveBeenCalledWith(skip);
            expect(mockCollection.limit).toHaveBeenCalledWith(limit);
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(result).toEqual(mockInstallations);
        });
    });

    describe('findById', () => {
        const validId = new ObjectId();

        // Prueba: Verificar que findById llama a findOne con el ObjectId correcto
        test('Debe llamar a findOne con el ObjectId correcto', async () => {
            const mockInstallation = { _id: validId, name: 'Gym 2' };
            mockCollection.findOne.mockResolvedValue(mockInstallation);

            const result = await installationRepository.findById(validId.toString());

            expect(getDB).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('installations');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: validId });
            expect(result).toEqual(mockInstallation);
        });

        // Prueba: Verificar que devuelve null para un ID no válido
        test('Debe devolver null si el ID no es válido', async () => {
            const result = await installationRepository.findById('invalid-id');
            expect(result).toBeNull();
            expect(mockCollection.findOne).not.toHaveBeenCalled(); // No debería intentar buscar
        });

        // Prueba: Verificar que devuelve null si no encuentra la instalación
        test('Debe devolver null si la instalación no se encuentra', async () => {
            mockCollection.findOne.mockResolvedValue(null);
            const result = await installationRepository.findById(validId.toString());
            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        // Prueba: Verificar que create llama a insertOne y añade timestamps
        test('Debe llamar a insertOne y añadir createdAt y updatedAt', async () => {
            const newInstallationData = { name: 'New Gym', city: 'Barcelona' };
            const insertedId = new ObjectId();
            mockCollection.insertOne.mockResolvedValue({ insertedId: insertedId });

            const result = await installationRepository.create(newInstallationData);

            expect(getDB).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('installations');
            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                ...newInstallationData,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date)
            }));
            expect(result).toEqual({ _id: insertedId, ...newInstallationData });
        });
    });

    describe('update', () => {
        const validId = new ObjectId();
        const updateData = { name: 'Updated Gym', city: 'Valencia' };

        // Prueba: Verificar que update llama a findOneAndUpdate y actualiza timestamps
        test('Debe llamar a findOneAndUpdate y actualizar updatedAt', async () => {
            const updatedInstallation = { _id: validId, ...updateData, createdAt: new Date(), updatedAt: new Date() };
            mockCollection.findOneAndUpdate.mockResolvedValue(updatedInstallation); // Mockear el valor de retorno

            const result = await installationRepository.update(validId.toString(), updateData);

            expect(getDB).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('installations');
            expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: validId },
                { $set: expect.objectContaining({
                    ...updateData,
                    updatedAt: expect.any(Date)
                }) },
                { returnDocument: 'after' }
            );
            expect(result).toEqual(updatedInstallation);
        });

        // Prueba: Verificar que devuelve null para un ID no válido
        test('Debe devolver null si el ID no es válido', async () => {
            const result = await installationRepository.update('invalid-id', updateData);
            expect(result).toBeNull();
            expect(mockCollection.findOneAndUpdate).not.toHaveBeenCalled();
        });

        // Prueba: Verificar que devuelve null si la instalación no se encuentra para actualizar
        test('Debe devolver null si la instalación no se encuentra para actualizar', async () => {
            mockCollection.findOneAndUpdate.mockResolvedValue(null);
            const result = await installationRepository.update(validId.toString(), updateData);
            expect(result).toBeNull();
        });
    });

    describe('remove', () => {
        const validId = new ObjectId();

        // Prueba: Verificar que remove llama a deleteOne y devuelve true si se borra
        test('Debe llamar a deleteOne y devolver true si se borra una instalación', async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const result = await installationRepository.remove(validId.toString());

            expect(getDB).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('installations');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: validId });
            expect(result).toBe(true);
        });

        // Prueba: Verificar que devuelve false si no se borra ninguna instalación
        test('Debe devolver false si no se borra ninguna instalación', async () => {
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
            const result = await installationRepository.remove(validId.toString());
            expect(result).toBe(false);
        });

        // Prueba: Verificar que devuelve false para un ID no válido
        test('Debe devolver false si el ID no es válido', async () => {
            const result = await installationRepository.remove('invalid-id');
            expect(result).toBe(false);
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
        });
    });
});
