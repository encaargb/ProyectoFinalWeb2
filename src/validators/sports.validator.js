const MAX_LIMIT = 100;

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function normalizeOptionalString(value) {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (!isNonEmptyString(value)) {
        return null;
    }

    return value.trim();
}

function validateSportsPagination(query) {
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

function validateSportsFilters(query) {
    const filters = {};

    if (query.name !== undefined) {
        if (!isNonEmptyString(query.name)) {
            return { error: 'name debe ser un texto no vacío.' };
        }
        filters.name = { $regex: query.name.trim(), $options: 'i' };
    }

    if (query.osmKey !== undefined) {
        if (!isNonEmptyString(query.osmKey)) {
            return { error: 'osmKey debe ser un texto no vacío.' };
        }
        filters.osmKey = query.osmKey.trim();
    }

    if (query.category !== undefined) {
        if (!isNonEmptyString(query.category)) {
            return { error: 'category debe ser un texto no vacío.' };
        }
        filters.category = query.category.trim();
    }

    if (query.environment !== undefined) {
        if (!isNonEmptyString(query.environment)) {
            return { error: 'environment debe ser un texto no vacío.' };
        }
        filters.environment = query.environment.trim();
    }

    if (query.missingMetadata !== undefined) {
        if (query.missingMetadata !== 'true' && query.missingMetadata !== 'false') {
            return { error: 'missingMetadata debe ser true o false.' };
        }

        if (query.missingMetadata === 'true') {
            filters.$or = [
                { category: null },
                { environment: null }
            ];
        }
    }

    return { value: filters };
}

function validateSportPayload(payload, options = {}) {
    const { partial = false } = options;

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return { error: 'El cuerpo de la petición debe ser un objeto JSON.' };
    }

    if (!partial || payload.name !== undefined) {
        if (!isNonEmptyString(payload.name)) {
            return { error: 'El campo name es obligatorio y debe ser un texto no vacío.' };
        }
    }

    if (payload.osmKey !== undefined && payload.osmKey !== null && !isNonEmptyString(payload.osmKey)) {
        return { error: 'osmKey debe ser un texto no vacío o null.' };
    }

    if (payload.category !== undefined && payload.category !== null && !isNonEmptyString(payload.category)) {
        return { error: 'category debe ser un texto no vacío o null.' };
    }

    if (payload.environment !== undefined && payload.environment !== null && !isNonEmptyString(payload.environment)) {
        return { error: 'environment debe ser un texto no vacío o null.' };
    }

    const normalized = {};

    if (payload.name !== undefined) {
        normalized.name = payload.name.trim();
    }

    if (!partial || payload.osmKey !== undefined) {
        normalized.osmKey = normalizeOptionalString(payload.osmKey) ?? null;
    }

    if (!partial || payload.category !== undefined) {
        normalized.category = normalizeOptionalString(payload.category) ?? null;
    }

    if (!partial || payload.environment !== undefined) {
        normalized.environment = normalizeOptionalString(payload.environment) ?? null;
    }

    return { value: normalized };
}

module.exports = {
    validateSportPayload,
    validateSportsFilters,
    validateSportsPagination
};
