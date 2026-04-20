const {
    validateSportPayload,
    validateSportsFilters,
    validateSportsPagination
} = require('../../src/validators/sports.validator');

describe('Sports validator', () => {
    test('validateSportsPagination acepta valores válidos', () => {
        const result = validateSportsPagination({ page: '2', limit: '5' });
        expect(result.value).toEqual({ page: 2, limit: 5, skip: 5 });
    });

    test('validateSportsPagination rechaza límites fuera de rango', () => {
        expect(validateSportsPagination({ page: '1', limit: '101' }).error).toContain('limit');
    });

    test('validateSportsFilters genera filtro por nombre', () => {
        expect(validateSportsFilters({ name: 'tenis' }).value).toEqual({
            name: { $regex: 'tenis', $options: 'i' }
        });
    });

    test('validateSportsFilters genera filtro de metadatos incompletos', () => {
        expect(validateSportsFilters({ missingMetadata: 'true' }).value).toEqual({
            $or: [
                { category: null },
                { environment: null }
            ]
        });
    });

    test('validateSportsFilters rechaza missingMetadata inválido', () => {
        expect(validateSportsFilters({ missingMetadata: 'quizas' }).error).toContain('missingMetadata');
    });

    test('validateSportPayload valida creación completa', () => {
        const result = validateSportPayload({
            name: '  tenis  ',
            osmKey: '  tennis  ',
            category: '  racket  ',
            environment: '  outdoor  '
        });

        expect(result.value).toEqual({
            name: 'tenis',
            osmKey: 'tennis',
            category: 'racket',
            environment: 'outdoor'
        });
    });

    test('validateSportPayload permite null en metadatos opcionales', () => {
        const result = validateSportPayload({
            name: 'tenis',
            osmKey: null,
            category: null,
            environment: null
        });

        expect(result.value).toEqual({
            name: 'tenis',
            osmKey: null,
            category: null,
            environment: null
        });
    });

    test('validateSportPayload rechaza name vacío', () => {
        expect(validateSportPayload({ name: '   ' }).error).toContain('name');
    });

    test('validateSportPayload en patch acepta payload parcial', () => {
        const result = validateSportPayload({ category: 'indoor' }, { partial: true });
        expect(result.value).toEqual({ category: 'indoor' });
    });
});
