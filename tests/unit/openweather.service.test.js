jest.mock('../../src/services/openweather.service', () => jest.requireActual('../../src/services/openweather.service'));

const {
    buildCurrentWeatherUrl,
    fetchCurrentWeatherByCoordinates,
    getWeatherConfig,
    isWeatherRecordFresh,
    normalizeOpenWeatherXmlPayload,
    parseOpenWeatherXml
} = require('../../src/services/openweather.service');

describe('OpenWeather service', () => {
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
        jest.restoreAllMocks();
        process.env = {
            ...ORIGINAL_ENV,
            OPENWEATHER_API_KEY: 'test-key',
            OPENWEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5',
            WEATHER_CACHE_TTL_MINUTES: '60'
        };
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV;
    });

    test('getWeatherConfig devuelve configuración válida', () => {
        expect(getWeatherConfig()).toEqual({
            apiKey: 'test-key',
            baseUrl: 'https://api.openweathermap.org/data/2.5',
            ttlMinutes: 60
        });
    });

    test('buildCurrentWeatherUrl construye la URL de Current Weather API 2.5 con métricas, español y XML', () => {
        const url = buildCurrentWeatherUrl({
            lat: 40.3,
            lon: -3.7,
            config: getWeatherConfig()
        });

        expect(url).toContain('/data/2.5/weather?');
        expect(url).toContain('lat=40.3');
        expect(url).toContain('lon=-3.7');
        expect(url).toContain('units=metric');
        expect(url).toContain('lang=es');
        expect(url).toContain('mode=xml');
        expect(url).not.toContain('exclude=');
    });

    test('parseOpenWeatherXml interpreta una respuesta XML válida del proveedor', () => {
        const payload = parseOpenWeatherXml(`
            <current>
                <temperature value="21" unit="metric"/>
                <humidity value="40" unit="%"/>
                <wind>
                    <speed value="10" unit="m/s" name="Fresh Breeze"/>
                </wind>
                <weather number="800" value="cielo claro" icon="01d"/>
            </current>
        `);

        expect(payload.current.temperature.value).toBe(21);
        expect(payload.current.weather.value).toBe('cielo claro');
    });

    test('normalizeOpenWeatherXmlPayload adapta la respuesta XML parseada del proveedor', () => {
        const queryDate = new Date('2026-04-22T10:00:00.000Z');
        const result = normalizeOpenWeatherXmlPayload({
            current: {
                temperature: { value: 21 },
                humidity: { value: 40 },
                wind: { speed: { value: 10 } },
                weather: { value: 'cielo claro' }
            }
        }, queryDate);

        expect(result).toEqual({
            queryDate,
            temperature: 21,
            condition: 'cielo claro',
            humidity: 40,
            windspeed: 10
        });
    });

    test('normalizeOpenWeatherXmlPayload rechaza payload sin datos obligatorios', () => {
        expect(() => normalizeOpenWeatherXmlPayload({
            current: {
                temperature: {},
                weather: {}
            }
        })).toThrow('meteorológica');
    });

    test('parseOpenWeatherXml rechaza XML mal formado', () => {
        expect(() => parseOpenWeatherXml('<current><temperature value="21"></current>')).toThrow('meteorológica');
    });

    test('isWeatherRecordFresh devuelve true si queryDate está dentro del TTL', () => {
        const freshDate = new Date(Date.now() - 10 * 60 * 1000);
        expect(isWeatherRecordFresh(freshDate, 60)).toBe(true);
    });

    test('isWeatherRecordFresh devuelve false si queryDate está caducado', () => {
        const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
        expect(isWeatherRecordFresh(staleDate, 60)).toBe(false);
    });

    test('fetchCurrentWeatherByCoordinates llama al proveedor y normaliza respuesta', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue(`
                <current>
                    <temperature value="22" unit="metric"/>
                    <humidity value="35" unit="%"/>
                    <wind>
                        <speed value="4" unit="m/s" name="Gentle Breeze"/>
                    </wind>
                    <weather number="800" value="soleado" icon="01d"/>
                </current>
            `)
        });

        const result = await fetchCurrentWeatherByCoordinates({
            lat: 40.3,
            lon: -3.7,
            fetchImpl,
            queryDate: new Date('2026-04-22T10:00:00.000Z')
        });

        expect(fetchImpl).toHaveBeenCalled();
        expect(fetchImpl.mock.calls[0][0]).toContain('mode=xml');
        expect(result.temperature).toBe(22);
        expect(result.condition).toBe('soleado');
    });

    test('fetchCurrentWeatherByCoordinates devuelve 502 si falla el proveedor', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: false
        });

        await expect(fetchCurrentWeatherByCoordinates({
            lat: 40.3,
            lon: -3.7,
            fetchImpl
        })).rejects.toMatchObject({ status: 502 });
    });

    test('getWeatherConfig devuelve 500 si falta la API key', () => {
        delete process.env.OPENWEATHER_API_KEY;
        expect(() => getWeatherConfig()).toThrow('configurada');
    });
});
