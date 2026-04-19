const {
    validateFilters,
    validateInstallationForXml,
    validateInstallationPayload,
    validatePagination
} = require('../../src/validators/installations.validator');

describe('Installations validator', () => {
    test('validatePagination acepta valores válidos', () => {
        const result = validatePagination({ page: '2', limit: '5' });
        expect(result.value).toEqual({ page: 2, limit: 5, skip: 5 });
    });

    test('validatePagination rechaza límites fuera de rango', () => {
        expect(validatePagination({ page: '1', limit: '101' }).error).toContain('limit');
    });

    test('validateFilters rechaza filtros vacíos', () => {
        expect(validateFilters({ type: '   ' }).error).toContain('type');
        expect(validateFilters({ sport: '' }).error).toContain('sport');
    });

    test('validateInstallationPayload rechaza un cuerpo que no es objeto', () => {
        expect(validateInstallationPayload([]).error).toContain('objeto JSON');
    });

    test('validateInstallationPayload normaliza el payload correcto', () => {
        const result = validateInstallationPayload({
            name: '  Gym  ',
            type: '  gym  ',
            city: '  Madrid  ',
            sports: [{ name: '  Tenis  ', sportId: '  1  ' }],
            location: { type: 'Point', coordinates: ['-3.7', '40.4'] },
            externalId: '  ext-1  ',
            source: '  manual  ',
            lastUpdated: '2026-04-19T10:00:00.000Z'
        });

        expect(result.value).toEqual({
            name: 'Gym',
            type: 'gym',
            city: 'Madrid',
            sports: [{ name: 'Tenis', sportId: '1' }],
            location: { type: 'Point', coordinates: [-3.7, 40.4] },
            externalId: 'ext-1',
            source: 'manual',
            lastUpdated: new Date('2026-04-19T10:00:00.000Z')
        });
    });

    test('validateInstallationPayload rechaza deportes sin nombre', () => {
        expect(validateInstallationPayload({
            name: 'Gym',
            type: 'gym',
            city: 'Madrid',
            sports: [{ sportId: '1' }]
        }).error).toContain('name');
    });

    test('validateInstallationPayload rechaza sportId vacío', () => {
        expect(validateInstallationPayload({
            name: 'Gym',
            type: 'gym',
            city: 'Madrid',
            sports: [{ name: 'Tenis', sportId: '   ' }]
        }).error).toContain('sportId');
    });

    test('validateInstallationPayload rechaza location no GeoJSON', () => {
        expect(validateInstallationPayload({
            name: 'Gym',
            type: 'gym',
            city: 'Madrid',
            location: []
        }).error).toContain('GeoJSON');
    });

    test('validateInstallationPayload rechaza coordenadas no numéricas', () => {
        expect(validateInstallationPayload({
            name: 'Gym',
            type: 'gym',
            city: 'Madrid',
            location: { type: 'Point', coordinates: ['x', 40.4] }
        }).error).toContain('números válidos');
    });

    test('validateInstallationPayload rechaza lastUpdated inválido', () => {
        expect(validateInstallationPayload({
            name: 'Gym',
            type: 'gym',
            city: 'Madrid',
            lastUpdated: 'fecha-rara'
        }).error).toContain('ISO 8601');
    });

    test('validateInstallationPayload aplica valores por defecto', () => {
        const result = validateInstallationPayload({
            name: 'Gym',
            type: 'gym',
            city: 'Madrid'
        });

        expect(result.value.sports).toEqual([]);
        expect(result.value.location).toEqual({ type: 'Point', coordinates: [] });
        expect(result.value.externalId).toBeNull();
        expect(result.value.source).toBe('manual');
        expect(result.value.lastUpdated).toEqual(expect.any(Date));
    });

    test('validateInstallationForXml rechaza instalaciones incompletas', () => {
        expect(validateInstallationForXml({ id: '1', name: 'Gym' }).error).toContain('contrato mínimo');
    });

    test('validateInstallationForXml rechaza sports inválidos', () => {
        expect(validateInstallationForXml({
            id: '1',
            name: 'Gym',
            type: 'gym',
            city: 'Madrid',
            sports: [{}]
        }).error).toContain('XML');
    });

    test('validateInstallationForXml acepta una instalación válida', () => {
        const installation = {
            id: '1',
            name: 'Gym',
            type: 'gym',
            city: 'Madrid',
            sports: [{ name: 'Tenis' }],
            location: { type: 'Point', coordinates: [-3.7, 40.4] }
        };

        expect(validateInstallationForXml(installation).value).toEqual(installation);
    });
});
