import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fetchApiStatus,
  fetchInstallationById,
  fetchInstallations,
  fetchInstallationWeather
} from '../../src/api/api.js';

test('fetchApiStatus devuelve el mensaje del backend cuando la API responde correctamente', async () => {
  const fetchImpl = async (url, options) => ({
    ok: true,
    json: async () => ({ message: 'Sports Facilities API is running' }),
    url,
    options
  });

  const result = await fetchApiStatus(fetchImpl, 'http://localhost:3000');

  // Verificamos que la llamada usa la ruta raíz de la API y el encabezado esperado.
  assert.equal(result.message, 'Sports Facilities API is running');
});

test('fetchApiStatus lanza un error legible si la API responde con error HTTP', async () => {
  const fetchImpl = async () => ({
    ok: false
  });

  await assert.rejects(
    () => fetchApiStatus(fetchImpl, 'http://localhost:3000'),
    /No se pudo comprobar el estado de la API\./
  );
});

test('fetchApiStatus lanza un error si la respuesta no incluye el mensaje esperado', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({})
  });

  await assert.rejects(
    () => fetchApiStatus(fetchImpl, 'http://localhost:3000'),
    /La API devolvió una respuesta inesperada\./
  );
});

test('fetchInstallations construye la consulta con filtros y paginación', async () => {
  let requestedUrl;
  const fetchImpl = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'inst-1',
            name: 'Polideportivo Juan de la Cierva',
            type: 'sports_centre',
            city: 'Getafe'
          }
        ],
        pagination: { page: 2, limit: 5 }
      })
    };
  };

  const result = await fetchInstallations(
    { name: 'Polideportivo', city: 'Getafe', type: '', sport: 'football', page: 2, limit: 5 },
    fetchImpl,
    'http://localhost:3000'
  );

  assert.equal(result.data.length, 1);
  assert.match(requestedUrl, /^http:\/\/localhost:3000\/installations\?/);
  assert.match(requestedUrl, /name=Polideportivo/);
  assert.match(requestedUrl, /city=Getafe/);
  assert.match(requestedUrl, /sport=football/);
  assert.match(requestedUrl, /page=2/);
  assert.match(requestedUrl, /limit=5/);
  assert.doesNotMatch(requestedUrl, /type=/);
});

test('fetchInstallations muestra el mensaje de error devuelto por la API', async () => {
  const fetchImpl = async () => ({
    ok: false,
    json: async () => ({ message: 'city debe ser un texto no vacío.' })
  });

  await assert.rejects(
    () => fetchInstallations({ city: ' ' }, fetchImpl, 'http://localhost:3000'),
    /city debe ser un texto no vacío\./
  );
});

test('fetchInstallationById devuelve el detalle de una instalación', async () => {
  let requestedUrl;
  const fetchImpl = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({
        data: {
          id: '507f1f77bcf86cd799439011',
          name: 'Estadio municipal',
          type: 'stadium',
          city: 'Madrid'
        }
      })
    };
  };

  const result = await fetchInstallationById(
    '507f1f77bcf86cd799439011',
    fetchImpl,
    'http://localhost:3000'
  );

  assert.equal(result.name, 'Estadio municipal');
  assert.equal(requestedUrl, 'http://localhost:3000/installations/507f1f77bcf86cd799439011');
});

test('fetchInstallationWeather devuelve la meteorología de una instalación', async () => {
  let requestedUrl;
  const fetchImpl = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({
        data: {
          id: 'weather-1',
          installationId: '507f1f77bcf86cd799439011',
          temperature: 21.4,
          condition: 'cielo claro',
          humidity: 42,
          windspeed: 2.1,
          queryDate: '2026-04-25T12:30:00.000Z'
        }
      })
    };
  };

  const result = await fetchInstallationWeather(
    '507f1f77bcf86cd799439011',
    fetchImpl,
    'http://localhost:3000'
  );

  assert.equal(result.condition, 'cielo claro');
  assert.equal(requestedUrl, 'http://localhost:3000/installations/507f1f77bcf86cd799439011/weather');
});

test('fetchInstallationWeather muestra errores devueltos por la API', async () => {
  const fetchImpl = async () => ({
    ok: false,
    json: async () => ({
      message: 'La instalación no tiene coordenadas válidas para consultar meteorología'
    })
  });

  await assert.rejects(
    () => fetchInstallationWeather('inst-1', fetchImpl, 'http://localhost:3000'),
    /coordenadas válidas/
  );
});
