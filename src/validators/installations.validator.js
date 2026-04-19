const MAX_LIMIT = 100;

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

// Convierte textos opcionales en un formato consistente:
// undefined/null siguen siendo ausencia de valor, el resto se limpia con trim.
function normalizeOptionalString(value) {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!isNonEmptyString(value)) {
        return null;
    }

    return value.trim();
}

function validatePagination(query) {
    const pageValue = query.page ?? '1';
    const limitValue = query.limit ?? '10';

    const page = Number.parseInt(pageValue, 10);
    const limit = Number.parseInt(limitValue, 10);

    if (!Number.isInteger(page) || page < 1) {
        return { error: 'page debe ser un entero mayor que 0.' };
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
        return { error: `limit debe ser un entero entre 1 y ${MAX_LIMIT}.` };
    }

    return {
        value: {
            page,
            limit,
            skip: (page - 1) * limit
        }
    };
}

function validateFilters(query) {
    // Aquí convertimos los filtros de la URL al objeto que entiende MongoDB.
    const filters = {};

    if (query.city !== undefined) {
        if (!isNonEmptyString(query.city)) {
            return { error: 'city debe ser un texto no vacío.' };
        }
        filters.city = query.city.trim();
    }

    if (query.type !== undefined) {
        if (!isNonEmptyString(query.type)) {
            return { error: 'type debe ser un texto no vacío.' };
        }
        filters.type = query.type.trim();
    }

    if (query.sport !== undefined) {
        if (!isNonEmptyString(query.sport)) {
            return { error: 'sport debe ser un texto no vacío.' };
        }
        filters['sports.name'] = query.sport.trim();
    }

    return { value: filters };
}

function validateSports(sports) {
    if (sports === undefined) {
        return { value: [] };
    }

    if (!Array.isArray(sports)) {
        return { error: 'sports debe ser un array.' };
    }

    const normalizedSports = [];

    for (const sport of sports) {
        if (!sport || typeof sport !== 'object' || Array.isArray(sport)) {
            return { error: 'Cada elemento de sports debe ser un objeto.' };
        }

        if (!isNonEmptyString(sport.name)) {
            return { error: 'Cada deporte debe incluir un campo name no vacío.' };
        }

        const normalizedSport = {
            name: sport.name.trim()
        };

        if (sport.sportId !== undefined) {
            if (!isNonEmptyString(sport.sportId)) {
                return { error: 'sportId debe ser un texto no vacío cuando se informa.' };
            }
            normalizedSport.sportId = sport.sportId.trim();
        }

        normalizedSports.push(normalizedSport);
    }

    return { value: normalizedSports };
}

function validateLocation(location) {
    // Seguimos una versión sencilla de GeoJSON: solo aceptamos puntos [longitud, latitud].
    if (location === undefined) {
        return { value: undefined };
    }

    if (!location || typeof location !== 'object' || Array.isArray(location)) {
        return { error: 'location debe ser un objeto GeoJSON.' };
    }

    if (location.type !== 'Point') {
        return { error: 'location.type debe ser "Point".' };
    }

    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return { error: 'location.coordinates debe contener exactamente dos números.' };
    }

    const coordinates = location.coordinates.map((value) => Number(value));

    if (coordinates.some((value) => !Number.isFinite(value))) {
        return { error: 'location.coordinates debe contener números válidos.' };
    }

    return {
        value: {
            type: 'Point',
            coordinates
        }
    };
}

function validateLastUpdated(lastUpdated) {
    if (lastUpdated === undefined) {
        return { value: undefined };
    }

    const parsedDate = new Date(lastUpdated);
    if (Number.isNaN(parsedDate.getTime())) {
        return { error: 'lastUpdated debe ser una fecha válida en formato ISO 8601.' };
    }

    return { value: parsedDate };
}

function validateInstallationPayload(payload, options = {}) {
    const { requireAllFields = true } = options;

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return { error: 'El cuerpo de la petición debe ser un objeto JSON.' };
    }

    const requiredFields = ['name', 'type', 'city'];
    for (const field of requiredFields) {
        if (requireAllFields && !isNonEmptyString(payload[field])) {
            return { error: `El campo ${field} es obligatorio y debe ser un texto no vacío.` };
        }

        if (!requireAllFields && payload[field] !== undefined && !isNonEmptyString(payload[field])) {
            return { error: `El campo ${field} debe ser un texto no vacío.` };
        }
    }

    const sportsResult = validateSports(payload.sports);
    if (sportsResult.error) {
        return sportsResult;
    }

    const locationResult = validateLocation(payload.location);
    if (locationResult.error) {
        return locationResult;
    }

    const lastUpdatedResult = validateLastUpdated(payload.lastUpdated);
    if (lastUpdatedResult.error) {
        return lastUpdatedResult;
    }

    const externalId = normalizeOptionalString(payload.externalId);
    if (payload.externalId !== undefined && externalId === null) {
        return { error: 'externalId debe ser un texto no vacío cuando se informa.' };
    }

    const source = normalizeOptionalString(payload.source);
    if (payload.source !== undefined && source === null) {
        return { error: 'source debe ser un texto no vacío cuando se informa.' };
    }

    return {
        value: {
            name: payload.name?.trim(),
            type: payload.type?.trim(),
            city: payload.city?.trim(),
            sports: sportsResult.value,
            location: locationResult.value ?? { type: 'Point', coordinates: [] },
            externalId: externalId ?? null,
            source: source ?? 'manual',
            lastUpdated: lastUpdatedResult.value ?? new Date()
        }
    };
}

function validateInstallationForXml(installation) {
    // El XML no usa un esquema externo aquí, así que validamos manualmente
    // que los datos tengan la forma mínima que esperamos exportar.
    if (!installation || typeof installation !== 'object') {
        return { error: 'La instalación no existe o no es serializable.' };
    }

    if (!isNonEmptyString(installation.id)) {
        return { error: 'La instalación carece de un id válido para exportar a XML.' };
    }

    if (!isNonEmptyString(installation.name) || !isNonEmptyString(installation.type) || !isNonEmptyString(installation.city)) {
        return { error: 'La instalación almacenada no cumple el contrato mínimo para XML.' };
    }

    const sportsResult = validateSports(installation.sports);
    if (sportsResult.error) {
        return { error: `La instalación almacenada no puede exportarse a XML: ${sportsResult.error}` };
    }

    const locationResult = validateLocation(installation.location);
    if (locationResult.error && installation.location !== undefined) {
        return { error: `La instalación almacenada no puede exportarse a XML: ${locationResult.error}` };
    }

    return { value: installation };
}

module.exports = {
    validateFilters,
    validateInstallationForXml,
    validateInstallationPayload,
    validatePagination
};
