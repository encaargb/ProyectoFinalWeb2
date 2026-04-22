const { ObjectId } = require('mongodb');
const {
    validateWeatherRecordsFilters,
    validateWeatherRecordsPagination,
    validateWeatherRecordsSorting
} = require('../../src/validators/weather-records.validator');

describe('Weather records validator', () => {
    test('validateWeatherRecordsPagination acepta valores válidos', () => {
        const result = validateWeatherRecordsPagination({ page: '2', limit: '5' });
        expect(result.value).toEqual({ page: 2, limit: 5, skip: 5 });
    });

    test('validateWeatherRecordsPagination rechaza límites fuera de rango', () => {
        expect(validateWeatherRecordsPagination({ page: '1', limit: '101' }).error).toContain('limit');
    });

    test('validateWeatherRecordsSorting devuelve orden por defecto', () => {
        expect(validateWeatherRecordsSorting({}).value).toEqual({ queryDate: -1 });
    });

    test('validateWeatherRecordsSorting rechaza sortBy inválido', () => {
        expect(validateWeatherRecordsSorting({ sortBy: 'humidity' }).error).toContain('sortBy');
    });

    test('validateWeatherRecordsSorting rechaza sortOrder inválido', () => {
        expect(validateWeatherRecordsSorting({ sortOrder: 'down' }).error).toContain('sortOrder');
    });

    test('validateWeatherRecordsFilters convierte installationId a ObjectId', () => {
        const id = new ObjectId().toString();
        const result = validateWeatherRecordsFilters({ installationId: id });
        expect(result.value.installationId).toEqual(new ObjectId(id));
    });

    test('validateWeatherRecordsFilters genera filtro por condición', () => {
        expect(validateWeatherRecordsFilters({ condition: 'clear' }).value).toEqual({
            condition: { $regex: 'clear', $options: 'i' }
        });
    });

    test('validateWeatherRecordsFilters genera rango de fechas', () => {
        const result = validateWeatherRecordsFilters({
            dateFrom: '2026-04-20T10:00:00.000Z',
            dateTo: '2026-04-21T10:00:00.000Z'
        });

        expect(result.value.queryDate.$gte).toEqual(new Date('2026-04-20T10:00:00.000Z'));
        expect(result.value.queryDate.$lte).toEqual(new Date('2026-04-21T10:00:00.000Z'));
    });

    test('validateWeatherRecordsFilters rechaza fechas inválidas', () => {
        expect(validateWeatherRecordsFilters({ dateFrom: 'ayer' }).error).toContain('dateFrom');
    });

    test('validateWeatherRecordsFilters rechaza rango invertido', () => {
        expect(validateWeatherRecordsFilters({
            dateFrom: '2026-04-22T10:00:00.000Z',
            dateTo: '2026-04-21T10:00:00.000Z'
        }).error).toContain('dateFrom');
    });
});
