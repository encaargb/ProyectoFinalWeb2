import {
  fetchApiStatus,
  fetchInstallationById,
  fetchInstallations,
  fetchInstallationWeather
} from './api/api.js';
import { renderHomePage } from './views/home.js';
import {
  renderInstallationDetail,
  renderInstallationsList,
  renderInstallationWeather
} from './views/installations.js';

function getFormValues(formElement) {
  const FormDataConstructor = formElement.ownerDocument.defaultView.FormData;
  const formData = new FormDataConstructor(formElement);

  return {
    name: formData.get('name'),
    city: formData.get('city'),
    type: formData.get('type'),
    sport: formData.get('sport'),
    limit: Number.parseInt(formData.get('limit'), 10) || 10
  };
}

function setStatus(statusNode, message, className) {
  statusNode.textContent = message;
  statusNode.classList.remove('is-success', 'is-error');

  if (className) {
    statusNode.classList.add(className);
  }
}

function setupInstallations(rootElement, dependencies) {
  const { fetchImpl } = dependencies;
  const form = rootElement.querySelector('#installations-filters');
  const clearButton = rootElement.querySelector('#installations-clear');
  const statusNode = rootElement.querySelector('#installations-status');
  const resultsNode = rootElement.querySelector('#installations-results');
  const detailNode = rootElement.querySelector('#installation-detail');
  const prevButton = rootElement.querySelector('#installations-prev');
  const nextButton = rootElement.querySelector('#installations-next');
  const pageNode = rootElement.querySelector('#installations-page');
  const state = {
    page: 1,
    limit: 10,
    filters: {},
    hasNextPage: false
  };

  async function loadInstallations() {
    setStatus(statusNode, 'Cargando instalaciones...', '');
    resultsNode.innerHTML = '';
    detailNode.innerHTML = '';
    prevButton.disabled = true;
    nextButton.disabled = true;

    try {
      const payload = await fetchInstallations(
        { ...state.filters, page: state.page, limit: state.limit },
        fetchImpl
      );
      state.hasNextPage = payload.data.length === state.limit;
      resultsNode.innerHTML = renderInstallationsList(payload.data);
      pageNode.textContent = `Página ${state.page}`;
      prevButton.disabled = state.page <= 1;
      nextButton.disabled = !state.hasNextPage;
      setStatus(statusNode, `${payload.data.length} instalaciones cargadas.`, 'is-success');
    } catch (error) {
      resultsNode.innerHTML = '';
      state.hasNextPage = false;
      pageNode.textContent = `Página ${state.page}`;
      setStatus(statusNode, error.message, 'is-error');
    }
  }

  async function loadInstallationDetail(id) {
    setStatus(statusNode, 'Cargando detalle de la instalación...', '');
    detailNode.innerHTML = '';

    try {
      const installation = await fetchInstallationById(id, fetchImpl);
      detailNode.innerHTML = renderInstallationDetail(installation);
      detailNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setStatus(statusNode, 'Detalle cargado correctamente.', 'is-success');
    } catch (error) {
      setStatus(statusNode, error.message, 'is-error');
    }
  }

  async function loadInstallationWeather(id) {
    const weatherStatusNode = detailNode.querySelector('#installation-weather-status');
    const weatherResultNode = detailNode.querySelector('#installation-weather-result');
    const weatherButton = detailNode.querySelector('[data-weather-installation-id]');

    if (!weatherStatusNode || !weatherResultNode || !weatherButton) {
      return;
    }

    setStatus(weatherStatusNode, 'Consultando meteorología...', '');
    weatherResultNode.innerHTML = '';
    weatherButton.disabled = true;

    try {
      const weatherRecord = await fetchInstallationWeather(id, fetchImpl);
      weatherResultNode.innerHTML = renderInstallationWeather(weatherRecord);
      setStatus(weatherStatusNode, 'Meteorología cargada correctamente.', 'is-success');
    } catch (error) {
      setStatus(weatherStatusNode, error.message, 'is-error');
    } finally {
      weatherButton.disabled = false;
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = getFormValues(form);
    state.filters = {
      name: values.name,
      city: values.city,
      type: values.type,
      sport: values.sport
    };
    state.limit = values.limit;
    state.page = 1;
    loadInstallations();
  });

  clearButton.addEventListener('click', () => {
    form.reset();
    state.filters = {};
    state.limit = 10;
    state.page = 1;
    loadInstallations();
  });

  prevButton.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      loadInstallations();
    }
  });

  nextButton.addEventListener('click', () => {
    if (state.hasNextPage) {
      state.page += 1;
      loadInstallations();
    }
  });

  resultsNode.addEventListener('click', (event) => {
    const detailButton = event.target.closest('[data-installation-id]');
    if (detailButton) {
      loadInstallationDetail(detailButton.dataset.installationId);
    }
  });

  detailNode.addEventListener('click', (event) => {
    const weatherButton = event.target.closest('[data-weather-installation-id]');
    if (weatherButton) {
      loadInstallationWeather(weatherButton.dataset.weatherInstallationId);
      return;
    }

    if (event.target.closest('#installation-detail-close')) {
      detailNode.innerHTML = '';
      setStatus(statusNode, 'Listado de instalaciones disponible.', 'is-success');
    }
  });

  return loadInstallations();
}

export async function mountApp(rootElement, dependencies = {}) {
  const { fetchImpl = globalThis.fetch } = dependencies;

  rootElement.innerHTML = renderHomePage();

  const statusNode = rootElement.querySelector('#api-status-text');

  try {
    // Comprobamos la conexión real con la API al arrancar para validar el entorno cuanto antes.
    const payload = await fetchApiStatus(fetchImpl);
    statusNode.textContent = `API disponible: ${payload.message}`;
    statusNode.classList.add('is-success');
  } catch (error) {
    statusNode.textContent = error.message;
    statusNode.classList.add('is-error');
  }

  await setupInstallations(rootElement, { fetchImpl });
}

const rootElement = typeof document !== 'undefined'
  ? document.querySelector('#app')
  : null;

if (rootElement) {
  mountApp(rootElement);
}
