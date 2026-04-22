const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const FALLBACK_OVERPASS_URLS = [
    DEFAULT_OVERPASS_URL,
    'https://overpass.private.coffee/api/interpreter'
];
const OSM_SOURCE = 'OpenStreetMap';
const DEFAULT_OVERPASS_TIMEOUT_MS = 45000;

function escapeOverpassValue(value) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Construimos la consulta de Overpass a partir del municipio indicado.
// El resultado pide nodos, ways y relaciones e incluye el centro geométrico
// para poder guardar coordenadas también cuando el elemento no es un punto.
function buildOverpassQuery({ municipality }) {
    if (!municipality || typeof municipality !== 'string' || municipality.trim().length === 0) {
        throw new Error('municipality es obligatorio para construir la consulta a OSM');
    }

    const safeMunicipality = escapeOverpassValue(municipality.trim());

    return `[out:json][timeout:120];
rel["boundary"="administrative"]["admin_level"="8"]["name"="${safeMunicipality}"]->.municipality;
.municipality map_to_area->.searchArea;
(
  nwr["leisure"~"sports_centre|pitch|stadium|track|fitness_station"](area.searchArea);
  nwr["amenity"="sports_centre"](area.searchArea);
);
out center tags;`;
}

function getCoordinates(element) {
    // Algunos elementos de OSM son nodos y otros way/relation con centro calculado.
    if (Number.isFinite(element?.lon) && Number.isFinite(element?.lat)) {
        return [element.lon, element.lat];
    }

    if (Number.isFinite(element?.center?.lon) && Number.isFinite(element?.center?.lat)) {
        return [element.center.lon, element.center.lat];
    }

    return null;
}

function normalizeSports(tags = {}) {
    // OSM puede traer varios deportes en un único tag separados por ; o ,
    if (!tags.sport || typeof tags.sport !== 'string') {
        return [];
    }

    const uniqueNames = [...new Set(
        tags.sport
            .split(/[;,]/)
            .map((sportName) => sportName.trim())
            .filter(Boolean)
    )];

    return uniqueNames.map((name) => ({ name }));
}

function inferInstallationType(tags = {}) {
    // Elegimos el tag más representativo disponible para clasificar la instalación.
    return tags.leisure || tags.amenity || tags.building || 'sports_facility';
}

function inferInstallationName(element, municipality) {
    // Si OSM no da nombre, construimos uno técnico para no perder el registro.
    if (typeof element?.tags?.name === 'string' && element.tags.name.trim().length > 0) {
        return element.tags.name.trim();
    }

    const type = inferInstallationType(element?.tags || {}).replace(/_/g, ' ');
    return `${type} ${municipality} ${element.type} ${element.id}`;
}

function transformOsmElementToInstallation(element, options = {}) {
    const municipality = options.municipality?.trim();
    const importedAt = options.importedAt || new Date();
    const coordinates = getCoordinates(element);

    if (!coordinates) {
        return null;
    }

    return {
        name: inferInstallationName(element, municipality),
        type: inferInstallationType(element.tags || {}),
        city: municipality,
        sports: normalizeSports(element.tags || {}),
        location: {
            type: 'Point',
            coordinates
        },
        externalId: `${element.type}/${element.id}`,
        source: OSM_SOURCE,
        lastUpdated: importedAt
    };
}

function transformOverpassElements(elements, options = {}) {
    if (!Array.isArray(elements)) {
        throw new Error('La respuesta de OSM no contiene una lista válida de elementos');
    }

    // Deduplicamos por externalId para evitar repetir el mismo recurso en la importación.
    const documentsById = new Map();

    for (const element of elements) {
        const document = transformOsmElementToInstallation(element, options);
        if (document) {
            documentsById.set(document.externalId, document);
        }
    }

    return [...documentsById.values()];
}

async function fetchOsmElements({
    municipality,
    overpassUrl = DEFAULT_OVERPASS_URL,
    fetchImpl = global.fetch,
    timeoutMs = DEFAULT_OVERPASS_TIMEOUT_MS,
    onProgress = () => {}
}) {
    if (typeof fetchImpl !== 'function') {
        throw new Error('Este entorno no dispone de fetch para consultar OSM');
    }

    const query = buildOverpassQuery({ municipality });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let response;

    onProgress(`Consultando OSM en ${overpassUrl}`);

    try {
        response = await fetchImpl(overpassUrl, {
            method: 'POST',
            headers: {
                'User-Agent': 'ProyectoFinalWeb2/1.0 (OSM import script)',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: controller.signal
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`La consulta a OSM superó el tiempo máximo de ${timeoutMs / 1000} segundos`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        const responseText = typeof response.text === 'function'
            ? await response.text()
            : '';
        const details = responseText ? `: ${responseText.slice(0, 300)}` : '';
        throw new Error(`OSM respondió con estado ${response.status}${details}`);
    }

    const payload = await response.json();
    return payload.elements || [];
}

async function fetchOsmElementsWithFallback({
    municipality,
    overpassUrls = FALLBACK_OVERPASS_URLS,
    fetchImpl = global.fetch,
    timeoutMs = DEFAULT_OVERPASS_TIMEOUT_MS,
    onProgress = () => {}
}) {
    let lastError;

    // Probamos varias instancias públicas de Overpass porque algunas suelen saturarse.
    for (const currentUrl of overpassUrls) {
        try {
            return await fetchOsmElements({
                municipality,
                overpassUrl: currentUrl,
                fetchImpl,
                timeoutMs,
                onProgress
            });
        } catch (error) {
            lastError = error;
            onProgress(`La instancia ${currentUrl} ha fallado: ${error.message}`);
        }
    }

    throw lastError;
}

async function upsertInstallationsFromService({ db, installations }) {
    if (!db) {
        throw new Error('Se necesita una conexión de base de datos para importar instalaciones');
    }

    if (!Array.isArray(installations)) {
        throw new Error('installations debe ser un array');
    }

    if (installations.length === 0) {
        return {
            received: 0,
            inserted: 0,
            updated: 0
        };
    }

    const collection = db.collection('installations');

    // Upsert permite crear o actualizar la instalación según externalId + source.
    const operations = installations.map((installation) => ({
        updateOne: {
            filter: {
                externalId: installation.externalId,
                source: installation.source
            },
            update: {
                $set: {
                    ...installation,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            upsert: true
        }
    }));

    const result = await collection.bulkWrite(operations, { ordered: false });

    return {
        received: installations.length,
        inserted: result.upsertedCount,
        updated: result.modifiedCount
    };
}

async function importInstallationsFromOsm({
    db,
    municipality,
    overpassUrl,
    fetchImpl,
    importedAt = new Date(),
    timeoutMs = DEFAULT_OVERPASS_TIMEOUT_MS,
    onProgress = () => {}
}) {
    const overpassUrls = overpassUrl ? [overpassUrl] : FALLBACK_OVERPASS_URLS;
    const elements = await fetchOsmElementsWithFallback({
        municipality,
        overpassUrls,
        fetchImpl,
        timeoutMs,
        onProgress
    });
    onProgress(`OSM ha devuelto ${elements.length} elementos crudos`);
    const installations = transformOverpassElements(elements, { municipality, importedAt });
    onProgress(`Se han transformado ${installations.length} instalaciones válidas`);
    const persistence = await upsertInstallationsFromService({ db, installations });
    onProgress(`MongoDB: ${persistence.inserted} insertadas, ${persistence.updated} actualizadas`);

    return {
        municipality,
        fetched: elements.length,
        imported: installations.length,
        ...persistence
    };
}

module.exports = {
    DEFAULT_OVERPASS_URL,
    DEFAULT_OVERPASS_TIMEOUT_MS,
    FALLBACK_OVERPASS_URLS,
    OSM_SOURCE,
    buildOverpassQuery,
    fetchOsmElements,
    fetchOsmElementsWithFallback,
    importInstallationsFromOsm,
    inferInstallationName,
    inferInstallationType,
    normalizeSports,
    transformOsmElementToInstallation,
    transformOverpassElements,
    upsertInstallationsFromService
};
