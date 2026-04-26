import assert from 'node:assert/strict';
import test from 'node:test';
import {
  renderInstallationDetail,
  renderInstallationsList,
  renderInstallationsSection,
  renderInstallationWeather
} from '../../src/views/installations.js';

test('renderInstallationsSection incluye filtros, resultados y controles de paginación', () => {
  const html = renderInstallationsSection();

  assert.match(html, /name="name"/);
  assert.match(html, /name="city"/);
  assert.match(html, /name="type"/);
  assert.match(html, /name="sport"/);
  assert.match(html, /id="installations-results"/);
  assert.match(html, /id="installations-prev"/);
  assert.match(html, /id="installations-next"/);
});

test('renderInstallationsList muestra instalaciones y deportes asociados', () => {
  const html = renderInstallationsList([
    {
      id: 'inst-1',
      name: 'Polideportivo Norte',
      type: 'sports_centre',
      city: 'Getafe',
      sports: [{ name: 'football' }, { name: 'basketball' }]
    }
  ]);

  assert.match(html, /Polideportivo Norte/);
  assert.match(html, /sports_centre/);
  assert.match(html, /Getafe/);
  assert.match(html, /football/);
  assert.match(html, /data-installation-id="inst-1"/);
});

test('renderInstallationsList muestra estado vacío si no hay resultados', () => {
  const html = renderInstallationsList([]);

  assert.match(html, /No hay instalaciones/);
});

test('renderInstallationDetail muestra los datos principales de la instalación', () => {
  const html = renderInstallationDetail({
    id: 'inst-1',
    name: 'Campo Central',
    type: 'pitch',
    city: 'Madrid',
    source: 'osm',
    lastUpdated: '2026-04-25T10:30:00.000Z',
    location: {
      type: 'Point',
      coordinates: [-3.70379, 40.41678]
    },
    sports: [{ name: 'tennis' }]
  });

  assert.match(html, /Campo Central/);
  assert.match(html, /pitch/);
  assert.match(html, /Madrid/);
  assert.match(html, /-3.70379, 40.41678/);
  assert.match(html, /osm/);
  assert.match(html, /tennis/);
  assert.match(html, /Consultar meteorología/);
  assert.match(html, /data-weather-installation-id="inst-1"/);
});

test('renderInstallationWeather muestra temperatura, condición, humedad, viento y fecha', () => {
  const html = renderInstallationWeather({
    temperature: 18.6,
    condition: 'lluvia ligera',
    humidity: 73,
    windspeed: 4.2,
    queryDate: '2026-04-25T14:00:00.000Z'
  });

  assert.match(html, /18,6 °C/);
  assert.match(html, /lluvia ligera/);
  assert.match(html, /73 %/);
  assert.match(html, /4,2 m\/s/);
  assert.match(html, /Meteorología actual/);
});
