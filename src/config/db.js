const { MongoClient } = require('mongodb');

let client;
let db;

async function connectDB(testDbName = null) { // Añadimos testDbName como parámetro opcional
    if (db) {
        return db;
    }

    const uri = process.env.MONGODB_URI;
    // Usamos testDbName si se proporciona, de lo contrario, usamos la variable de entorno
    const dbName = testDbName || process.env.MONGODB_DB_NAME;

    if (!uri) {
        throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }
    if (!dbName) {
        throw new Error('MONGODB_DB_NAME no está definida en las variables de entorno o no se proporcionó testDbName');
    }

    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log(`MongoDB conectada a la base de datos: ${dbName}`);
    return db;
}

function getDB() {
    if (!db) {
        // En un entorno de producción, esto podría ser un error.
        // Para tests, el mock de la DB se encarga de esto.
        // Aquí, si no hay conexión, devolvemos null o lanzamos un error si es crítico.
        // Por ahora, mantenemos el comportamiento para no romper los mocks unitarios.
        return null; // Cambiado de 'return db;' a 'return null;' para mayor claridad si no está conectada.
    }
    return db;
}

async function closeDB() {
    if (client) {
        await client.close();
        db = null; // Resetear la DB para futuras conexiones
        client = null; // Resetear el cliente
        console.log('MongoDB desconectada');
    }
}

module.exports = {
    connectDB,
    getDB,
    closeDB
};