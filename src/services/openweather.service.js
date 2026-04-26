const DEFAULT_OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const DEFAULT_WEATHER_CACHE_TTL_MINUTES = 60;

function createServiceError(code, message, status) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
}

function parseOptionalNumber(value) {
    return Number.isFinite(value) ? value : null;
}

// Leemos la configuración una única vez por operación para centralizar validaciones.
function getWeatherConfig() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const baseUrl = process.env.OPENWEATHER_BASE_URL || DEFAULT_OPENWEATHER_BASE_URL;
    const ttlValue = process.env.WEATHER_CACHE_TTL_MINUTES ?? String(DEFAULT_WEATHER_CACHE_TTL_MINUTES);
    const ttlMinutes = Number.parseInt(ttlValue, 10);

    if (!apiKey) {
        throw createServiceError(
            'WEATHER_CONFIG_MISSING',
            'La integración meteorológica no está configurada correctamente',
            500
        );
    }

    if (!Number.isInteger(ttlMinutes) || ttlMinutes < 1) {
        throw createServiceError(
            'WEATHER_CONFIG_INVALID',
            'La integración meteorológica no está configurada correctamente',
            500
        );
    }

    return {
        apiKey,
        baseUrl,
        ttlMinutes
    };
}

// Construimos la URL final del proveedor con coordenadas y configuración acordada.
function buildCurrentWeatherUrl({ lat, lon, config }) {
    const baseUrl = config.baseUrl.replace(/\/+$/, '');
    const url = new URL(`${baseUrl}/weather`);

    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('appid', config.apiKey);
    url.searchParams.set('units', 'metric');
    url.searchParams.set('lang', 'es');

    return url.toString();
}

function normalizeOpenWeatherPayload(payload, queryDate = new Date()) {
    const temperature = payload?.main?.temp;
    const condition = payload?.weather?.[0]?.description;

    if (!Number.isFinite(temperature) || typeof condition !== 'string' || condition.trim().length === 0) {
        throw createServiceError(
            'WEATHER_PROVIDER_INVALID_RESPONSE',
            'No se pudo obtener la información meteorológica del servicio externo',
            502
        );
    }

    return {
        queryDate,
        temperature,
        condition: condition.trim(),
        humidity: parseOptionalNumber(payload?.main?.humidity),
        windspeed: parseOptionalNumber(payload?.wind?.speed)
    };
}

// Esta función encapsula la llamada HTTP al proveedor y la transforma al contrato interno.
async function fetchCurrentWeatherByCoordinates({ lat, lon, fetchImpl = global.fetch, queryDate = new Date() }) {
    if (typeof fetchImpl !== 'function') {
        throw createServiceError(
            'WEATHER_FETCH_UNAVAILABLE',
            'No se pudo obtener la información meteorológica del servicio externo',
            502
        );
    }

    const config = getWeatherConfig();
    const url = buildCurrentWeatherUrl({ lat, lon, config });
    const response = await fetchImpl(url);

    if (!response.ok) {
        throw createServiceError(
            'WEATHER_PROVIDER_ERROR',
            'No se pudo obtener la información meteorológica del servicio externo',
            502
        );
    }

    const payload = await response.json();
    return normalizeOpenWeatherPayload(payload, queryDate);
}

// Un weather-record es vigente si su queryDate entra dentro del TTL configurado.
function isWeatherRecordFresh(queryDate, ttlMinutes) {
    if (!(queryDate instanceof Date) || Number.isNaN(queryDate.getTime())) {
        return false;
    }

    const configTtl = ttlMinutes ?? getWeatherConfig().ttlMinutes;
    const ttlMs = configTtl * 60 * 1000;
    return (Date.now() - queryDate.getTime()) <= ttlMs;
}

module.exports = {
    DEFAULT_OPENWEATHER_BASE_URL,
    DEFAULT_WEATHER_CACHE_TTL_MINUTES,
    buildCurrentWeatherUrl,
    createServiceError,
    fetchCurrentWeatherByCoordinates,
    getWeatherConfig,
    isWeatherRecordFresh,
    normalizeOpenWeatherPayload
};
