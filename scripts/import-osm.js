#!/usr/bin/env node

require('dotenv').config();

const { connectDB, closeDB } = require('../src/config/db');
const {
    importInstallationsFromOsm,
    DEFAULT_OVERPASS_TIMEOUT_MS,
    DEFAULT_OVERPASS_URL
} = require('../src/services/osm-import.service');

function parseArgs(argv) {
    const options = {};

    for (const arg of argv) {
        if (!arg.startsWith('--')) {
            continue;
        }

        const [rawKey, ...rawValueParts] = arg.slice(2).split('=');
        const value = rawValueParts.join('=');
        options[rawKey] = value || 'true';
    }

    return options;
}

function printUsage() {
    console.log('Uso: npm run import:osm -- --municipality=Getafe [--db=sports_facilities_test] [--overpassUrl=https://overpass-api.de/api/interpreter]');
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const municipality = options.municipality || options.zone;
    const dbName = options.db || null;
    const overpassUrl = options.overpassUrl;
    const timeoutMs = options.timeoutMs ? Number.parseInt(options.timeoutMs, 10) : DEFAULT_OVERPASS_TIMEOUT_MS;

    if (!municipality) {
        printUsage();
        throw new Error('Debes indicar el municipio con --municipality=NombreDelMunicipio');
    }

    if (!Number.isInteger(timeoutMs) || timeoutMs < 1000) {
        throw new Error('timeoutMs debe ser un entero mayor o igual que 1000');
    }

    let db;

    try {
        console.log(`[import:osm] Conectando con MongoDB${dbName ? ` (db=${dbName})` : ''}`);
        db = await connectDB(dbName);
        console.log(`[import:osm] Iniciando importación para ${municipality}`);
        console.log(`[import:osm] Instancia Overpass: ${overpassUrl || `automática (${DEFAULT_OVERPASS_URL} + fallback)`}`);
        const result = await importInstallationsFromOsm({
            db,
            municipality,
            overpassUrl,
            timeoutMs,
            onProgress: (message) => console.log(`[import:osm] ${message}`)
        });

        console.log('Importación completada');
        console.log(JSON.stringify(result, null, 2));
    } finally {
        await closeDB();
    }
}

main().catch((error) => {
    console.error('Error durante la importación OSM:');
    console.error(error.message);
    process.exitCode = 1;
});
