const { MongoClient } = require('mongodb');

let client;
let db;

// Esta función abre la conexión una sola vez y reutiliza la misma base de datos
// mientras la aplicación siga viva.
async function connectDB(testDbName = null) {
    if (db) {
        return db;
    }

    const uri = process.env.MONGODB_URI;
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

// Los repositorios usan esta función para pedir la conexión ya abierta.
function getDB() {
    if (!db) {
        return null;
    }
    return db;
}

// Cerrar la conexión es importante en tests y al apagar la aplicación.
async function closeDB() {
    if (client) {
        await client.close();
        db = null;
        client = null;
        console.log('MongoDB desconectada');
    }
}

module.exports = {
    connectDB,
    getDB,
    closeDB
};
