import { renderInstallationsSection } from './installations.js';

// La vista de inicio se genera desde una función pura para facilitar su prueba de forma aislada.
export function renderHomePage() {
  return `
    <div class="shell">
      <header class="hero">
        <p class="eyebrow">Proyecto Cliente</p>
        <h1>Sports Facilities Explorer</h1>
        <p class="lead">
          Cliente web independiente para consultar instalaciones deportivas, deportes
          del sistema e histórico meteorológico.
        </p>
      </header>

      <nav class="main-nav" aria-label="Navegación principal">
        <a href="#inicio">Inicio</a>
        <a href="#instalaciones">Instalaciones</a>
        <a href="#deportes">Deportes</a>
        <a href="#weather-records">Histórico meteorológico</a>
      </nav>

      <main class="content-stack">
        <section class="panel" id="inicio">
          <h2>Estado de la API</h2>
          <p id="api-status-text" class="status-text">Comprobando conexión con el backend...</p>
        </section>

        ${renderInstallationsSection()}

        <section class="panel" id="deportes">
          <h2>Deportes</h2>
          <p>Próxima iteración: consulta y gestión del recurso sports.</p>
        </section>

        <section class="panel" id="weather-records">
          <h2>Histórico meteorológico</h2>
          <p>Próxima iteración: filtros, ordenación y consulta de weather-records.</p>
        </section>
      </main>
    </div>
  `;
}
