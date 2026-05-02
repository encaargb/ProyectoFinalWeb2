const {
    attachSportsCatalogIdsToInstallations,
    buildOverpassQuery,
    extractSportsCatalogFromInstallations,
    fetchOsmElements,
    fetchOsmElementsWithFallback,
    importInstallationsFromOsm,
    normalizeSportsCatalogFromTags,
    transformOsmElementToInstallation,
    transformOverpassElements,
    upsertInstallationsFromService,
    upsertSportsCatalogFromService
} = require('../../src/services/osm-import.service');

describe('OSM import service', () => {
    test('buildOverpassQuery construye una consulta para el municipio', () => {
        const query = buildOverpassQuery({ municipality: 'Getafe' });

        expect(query).toContain('Getafe');
        expect(query).toContain('admin_level');
        expect(query).toContain('map_to_area');
        expect(query).toContain('sports_centre');
        expect(query).toContain('out center tags;');
    });

    test('transformOsmElementToInstallation convierte un nodo al modelo de la API', () => {
        const importedAt = new Date('2026-04-19T16:00:00.000Z');
        const document = transformOsmElementToInstallation({
            type: 'node',
            id: 123,
            lat: 40.3,
            lon: -3.7,
            tags: {
                name: 'Polideportivo Juan de la Cierva',
                leisure: 'sports_centre',
                sport: 'tennis;soccer'
            }
        }, {
            municipality: 'Getafe',
            importedAt
        });

        expect(document).toEqual({
            name: 'Polideportivo Juan de la Cierva',
            type: 'sports_centre',
            city: 'Getafe',
            sports: [
                { name: 'tennis', osmKey: 'tennis', category: null, environment: null },
                { name: 'soccer', osmKey: 'soccer', category: null, environment: null }
            ],
            location: {
                type: 'Point',
                coordinates: [-3.7, 40.3]
            },
            externalId: 'node/123',
            source: 'OpenStreetMap',
            lastUpdated: importedAt
        });
    });

    test('normalizeSportsCatalogFromTags crea entradas de catálogo con información OSM disponible', () => {
        const sports = normalizeSportsCatalogFromTags({
            sport: 'tennis;soccer',
            leisure: 'pitch'
        });

        expect(sports).toEqual([
            { name: 'tennis', osmKey: 'tennis', category: null, environment: 'outdoor' },
            { name: 'soccer', osmKey: 'soccer', category: null, environment: 'outdoor' }
        ]);
    });

    test('transformOverpassElements deduplica por externalId y descarta elementos sin coordenadas', () => {
        const documents = transformOverpassElements([
            {
                type: 'node',
                id: 1,
                lat: 40.1,
                lon: -3.6,
                tags: { leisure: 'pitch' }
            },
            {
                type: 'node',
                id: 1,
                lat: 40.1,
                lon: -3.6,
                tags: { leisure: 'pitch' }
            },
            {
                type: 'way',
                id: 2,
                tags: { leisure: 'stadium' }
            }
        ], { municipality: 'Getafe' });

        expect(documents).toHaveLength(1);
        expect(documents[0].externalId).toBe('node/1');
    });

    test('fetchOsmElements lanza error si OSM falla', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: false,
            status: 429,
            text: jest.fn().mockResolvedValue('Too many requests')
        });

        await expect(fetchOsmElements({
            municipality: 'Getafe',
            fetchImpl
        })).rejects.toThrow('429');
    });

    test('fetchOsmElements falla con timeout controlado', async () => {
        const fetchImpl = jest.fn((url, options) => new Promise((_, reject) => {
            options.signal.addEventListener('abort', () => {
                const abortError = new Error('Aborted');
                abortError.name = 'AbortError';
                reject(abortError);
            });
        }));

        await expect(fetchOsmElements({
            municipality: 'Getafe',
            fetchImpl,
            timeoutMs: 10
        })).rejects.toThrow('tiempo máximo');
    });

    test('upsertInstallationsFromService hace bulkWrite y devuelve estadísticas', async () => {
        const bulkWrite = jest.fn().mockResolvedValue({
            upsertedCount: 2,
            modifiedCount: 1
        });
        const db = {
            collection: jest.fn().mockReturnValue({ bulkWrite })
        };

        const result = await upsertInstallationsFromService({
            db,
            installations: [
                { externalId: 'node/1', source: 'OpenStreetMap', name: 'A' },
                { externalId: 'node/2', source: 'OpenStreetMap', name: 'B' }
            ]
        });

        expect(db.collection).toHaveBeenCalledWith('installations');
        expect(bulkWrite).toHaveBeenCalled();
        expect(result).toEqual({
            received: 2,
            inserted: 2,
            updated: 1
        });
    });

    test('extractSportsCatalogFromInstallations deduplica deportes por osmKey', () => {
        const sports = extractSportsCatalogFromInstallations([
            {
                sports: [
                    { name: 'tennis', osmKey: 'tennis', category: null, environment: 'outdoor' },
                    { name: 'soccer', osmKey: 'soccer', category: null, environment: 'outdoor' }
                ]
            },
            {
                sports: [
                    { name: 'tennis', osmKey: 'tennis', category: null, environment: 'outdoor' }
                ]
            }
        ]);

        expect(sports).toEqual([
            { name: 'tennis', osmKey: 'tennis', category: null, environment: 'outdoor' },
            { name: 'soccer', osmKey: 'soccer', category: null, environment: 'outdoor' }
        ]);
    });

    test('upsertSportsCatalogFromService hace upsert y devuelve deportes por osmKey', async () => {
        const tennisId = { toString: () => 'sport-tennis-id' };
        const bulkWrite = jest.fn().mockResolvedValue({
            upsertedCount: 1,
            modifiedCount: 1
        });
        const toArray = jest.fn().mockResolvedValue([
            { _id: tennisId, name: 'tennis', osmKey: 'tennis' }
        ]);
        const find = jest.fn().mockReturnValue({ toArray });
        const db = {
            collection: jest.fn().mockReturnValue({ bulkWrite, find })
        };

        const result = await upsertSportsCatalogFromService({
            db,
            sports: [
                { name: 'tennis', osmKey: 'tennis', category: null, environment: 'outdoor' }
            ]
        });

        expect(db.collection).toHaveBeenCalledWith('sports');
        expect(bulkWrite).toHaveBeenCalled();
        expect(find).toHaveBeenCalledWith({ osmKey: { $in: ['tennis'] } });
        expect(result.received).toBe(1);
        expect(result.inserted).toBe(1);
        expect(result.updated).toBe(1);
        expect(result.byOsmKey.get('tennis')._id.toString()).toBe('sport-tennis-id');
    });

    test('attachSportsCatalogIdsToInstallations enlaza sportId antes de guardar instalaciones', () => {
        const sportsByOsmKey = new Map([
            ['tennis', { _id: { toString: () => 'sport-tennis-id' }, osmKey: 'tennis' }]
        ]);

        const result = attachSportsCatalogIdsToInstallations([
            {
                name: 'Pista Norte',
                sports: [{ name: 'tennis', osmKey: 'tennis', category: null, environment: 'outdoor' }]
            }
        ], sportsByOsmKey);

        expect(result[0].sports).toEqual([
            { name: 'tennis', sportId: 'sport-tennis-id' }
        ]);
    });

    test('fetchOsmElementsWithFallback prueba otra instancia si la primera falla', async () => {
        const fetchImpl = jest
            .fn()
            .mockResolvedValueOnce({
                ok: false,
                status: 504,
                text: jest.fn().mockResolvedValue('Gateway Timeout')
            })
            .mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    elements: [
                        {
                            type: 'node',
                            id: 7,
                            lat: 40.3,
                            lon: -3.7,
                            tags: { leisure: 'pitch' }
                        }
                    ]
                })
            });

        const result = await fetchOsmElementsWithFallback({
            municipality: 'Getafe',
            overpassUrls: [
                'https://overpass-api.de/api/interpreter',
                'https://overpass.private.coffee/api/interpreter'
            ],
            fetchImpl
        });

        expect(fetchImpl).toHaveBeenCalledTimes(2);
        expect(result).toHaveLength(1);
    });

    test('importInstallationsFromOsm consulta OSM, transforma y persiste', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                elements: [
                    {
                        type: 'node',
                        id: 5,
                        lat: 40.3,
                        lon: -3.7,
                        tags: {
                            name: 'Pista Norte',
                            leisure: 'pitch',
                            sport: 'basketball'
                        }
                    }
                ]
            })
        });

        const installationsBulkWrite = jest.fn().mockResolvedValue({
            upsertedCount: 1,
            modifiedCount: 0
        });
        const sportsBulkWrite = jest.fn().mockResolvedValue({
            upsertedCount: 1,
            modifiedCount: 0
        });
        const sportId = { toString: () => 'sport-basketball-id' };
        const sportsFind = jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([
                { _id: sportId, name: 'basketball', osmKey: 'basketball' }
            ])
        });
        const db = {
            collection: jest.fn((name) => {
                if (name === 'sports') {
                    return { bulkWrite: sportsBulkWrite, find: sportsFind };
                }

                return { bulkWrite: installationsBulkWrite };
            })
        };
        const onProgress = jest.fn();

        const result = await importInstallationsFromOsm({
            db,
            municipality: 'Getafe',
            fetchImpl,
            importedAt: new Date('2026-04-19T16:00:00.000Z'),
            onProgress
        });

        expect(fetchImpl).toHaveBeenCalled();
        expect(sportsBulkWrite).toHaveBeenCalled();
        expect(installationsBulkWrite).toHaveBeenCalled();
        expect(installationsBulkWrite.mock.calls[0][0][0].updateOne.update.$set.sports).toEqual([
            { name: 'basketball', sportId: 'sport-basketball-id' }
        ]);
        expect(onProgress).toHaveBeenCalled();
        expect(result).toEqual({
            municipality: 'Getafe',
            fetched: 1,
            imported: 1,
            sportsCatalog: {
                received: 1,
                inserted: 1,
                updated: 0
            },
            received: 1,
            inserted: 1,
            updated: 0
        });
    });
});
