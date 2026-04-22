const { ObjectId } = require('mongodb');

const MAX_LIMIT = 100;
const ALLOWED_SORT_FIELDS = ['queryDate', 'temperature', 'createdAt'];

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateWeatherRecordsPagination(query) {
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

// Solo permitimos ordenar por un conjunto pequeño de campos para mantener el contrato controlado.
function validateWeatherRecordsSorting(query) {
    const sortBy = query.sortBy ?? 'queryDate';
    const sortOrder = query.sortOrder ?? 'desc';

    if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
        return { error: `sortBy debe ser uno de estos valores: ${ALLOWED_SORT_FIELDS.join(', ')}.` };
    }

    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
        return { error: 'sortOrder debe ser asc o desc.' };
    }

    return {
        value: {
            [sortBy]: sortOrder === 'asc' ? 1 : -1
        }
    };
}

function parseDate(value, fieldName) {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return { error: `${fieldName} debe ser una fecha válida en formato ISO 8601.` };
    }

    return { value: parsedDate };
}

function validateWeatherRecordsFilters(query) {
    // Construimos el filtro de MongoDB a partir de los query params permitidos.
    const filters = {};

    if (query.installationId !== undefined) {
        if (!ObjectId.isValid(query.installationId)) {
            return { error: 'installationId debe ser un ObjectId válido.' };
        }
        filters.installationId = new ObjectId(query.installationId);
    }

    if (query.condition !== undefined) {
        if (!isNonEmptyString(query.condition)) {
            return { error: 'condition debe ser un texto no vacío.' };
        }
        filters.condition = { $regex: query.condition.trim(), $options: 'i' };
    }

    if (query.dateFrom !== undefined || query.dateTo !== undefined) {
        filters.queryDate = {};

        if (query.dateFrom !== undefined) {
            const dateFromResult = parseDate(query.dateFrom, 'dateFrom');
            if (dateFromResult.error) {
                return dateFromResult;
            }
            filters.queryDate.$gte = dateFromResult.value;
        }

        if (query.dateTo !== undefined) {
            const dateToResult = parseDate(query.dateTo, 'dateTo');
            if (dateToResult.error) {
                return dateToResult;
            }
            filters.queryDate.$lte = dateToResult.value;
        }

        if (filters.queryDate.$gte && filters.queryDate.$lte && filters.queryDate.$gte > filters.queryDate.$lte) {
            return { error: 'dateFrom no puede ser posterior a dateTo.' };
        }
    }

    return { value: filters };
}

module.exports = {
    ALLOWED_SORT_FIELDS,
    validateWeatherRecordsFilters,
    validateWeatherRecordsPagination,
    validateWeatherRecordsSorting
};
