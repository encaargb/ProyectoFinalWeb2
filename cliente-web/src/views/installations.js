function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatText(value, fallback = 'Sin informar') {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }

  return escapeHtml(value);
}

function formatDate(value) {
  if (!value) {
    return 'Sin informar';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatText(value);
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function renderSports(sports) {
  if (!Array.isArray(sports) || sports.length === 0) {
    return '<span class="muted">Sin deportes asociados</span>';
  }

  return sports
    .map((sport) => `<span class="tag">${formatText(sport?.name ?? sport)}</span>`)
    .join('');
}

function renderCoordinates(location) {
  const coordinates = location?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return 'Sin informar';
  }

  return coordinates.map((coordinate) => Number(coordinate).toFixed(5)).join(', ');
}

export function renderInstallationsSection() {
  return `
    <section class="panel panel-wide" id="instalaciones">
      <div class="section-header">
        <div>
          <p class="eyebrow">Consulta</p>
          <h2>Instalaciones deportivas</h2>
        </div>
        <p class="section-summary">Filtra, pagina y abre el detalle de cada instalación.</p>
      </div>

      <form class="filters-form" id="installations-filters">
        <label>
          Nombre
          <input type="search" name="name" placeholder="Polideportivo" />
        </label>
        <label>
          Ciudad
          <input type="search" name="city" placeholder="Getafe" />
        </label>
        <label>
          Tipo
          <input type="search" name="type" placeholder="sports_centre" />
        </label>
        <label>
          Deporte
          <input type="search" name="sport" placeholder="football" />
        </label>
        <label>
          Resultados
          <select name="limit">
            <option value="5">5</option>
            <option value="10" selected>10</option>
            <option value="20">20</option>
          </select>
        </label>
        <div class="form-actions">
          <button type="submit">Buscar</button>
          <button type="button" class="secondary-button" id="installations-clear">Limpiar</button>
        </div>
      </form>

      <p class="status-text" id="installations-status">Cargando instalaciones...</p>
      <div id="installations-results"></div>
      <div id="installation-detail"></div>

      <div class="pagination" aria-label="Paginación de instalaciones">
        <button type="button" id="installations-prev">Anterior</button>
        <span id="installations-page">Página 1</span>
        <button type="button" id="installations-next">Siguiente</button>
      </div>
    </section>
  `;
}

export function renderInstallationsList(installations) {
  if (!Array.isArray(installations) || installations.length === 0) {
    return '<p class="empty-state">No hay instalaciones que coincidan con la consulta.</p>';
  }

  return `
    <div class="results-list">
      ${installations.map((installation) => `
        <article class="result-item">
          <div>
            <h3>${formatText(installation.name)}</h3>
            <dl class="compact-data">
              <div>
                <dt>Tipo</dt>
                <dd>${formatText(installation.type)}</dd>
              </div>
              <div>
                <dt>Ciudad</dt>
                <dd>${formatText(installation.city)}</dd>
              </div>
            </dl>
            <div class="tags">${renderSports(installation.sports)}</div>
          </div>
          <button type="button" data-installation-id="${escapeHtml(installation.id)}">Ver detalle</button>
        </article>
      `).join('')}
    </div>
  `;
}

export function renderInstallationDetail(installation) {
  if (!installation) {
    return '';
  }

  return `
    <section class="detail-panel" aria-live="polite">
      <div class="section-header">
        <div>
          <p class="eyebrow">Detalle</p>
          <h2>${formatText(installation.name)}</h2>
        </div>
        <button type="button" class="secondary-button" id="installation-detail-close">Cerrar</button>
      </div>

      <dl class="detail-grid">
        <div>
          <dt>Tipo</dt>
          <dd>${formatText(installation.type)}</dd>
        </div>
        <div>
          <dt>Ciudad</dt>
          <dd>${formatText(installation.city)}</dd>
        </div>
        <div>
          <dt>Coordenadas</dt>
          <dd>${renderCoordinates(installation.location)}</dd>
        </div>
        <div>
          <dt>Fuente</dt>
          <dd>${formatText(installation.source)}</dd>
        </div>
        <div>
          <dt>Última actualización</dt>
          <dd>${formatDate(installation.lastUpdated ?? installation.updatedAt)}</dd>
        </div>
      </dl>

      <div>
        <h3>Deportes asociados</h3>
        <div class="tags">${renderSports(installation.sports)}</div>
      </div>
    </section>
  `;
}
