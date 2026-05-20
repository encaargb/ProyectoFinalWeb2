# ProyectoFinalWeb2

**Autores:** Equipo del proyecto: Inés Del Río García, Encarnación Teresa González Buitrago, Jesús Joana Azuara y Lucía Sorní Scaletti.

API REST para consultar y gestionar instalaciones deportivas, deportes asociados e histórico meteorológico.

## Integrantes del grupo

- Inés Del Río García
- Encarnación Teresa González Buitrago
- Jesús Joana Azuara
- Lucía Sorní Scaletti

## Temática

El proyecto consiste en una plataforma para descubrir y consultar instalaciones deportivas. La API permite trabajar con instalaciones, catálogo de deportes e información meteorológica asociada a instalaciones concretas.

Los datos principales proceden de OpenStreetMap y se almacenan en MongoDB. La meteorología se obtiene desde OpenWeather cuando se consulta el endpoint correspondiente y se persiste como histórico en la base de datos.

## Repositorios del proyecto

- API REST: `ProyectoFinalWeb2`.
- Cliente web: `ProyectoFinalWeb2-Cliente`.

El cliente web es independiente y consume esta API mediante peticiones HTTP desde el navegador.

## Tecnologías

- Node.js
- Express
- MongoDB
- OpenAPI / Swagger UI
- Jest
- Supertest

## Requisitos previos

Para ejecutar el proyecto se necesita:

- Node.js instalado.
- MongoDB en ejecución en local o una URI de MongoDB accesible.
- MongoDB Database Tools si se quiere importar o exportar el dataset JSON con `mongoimport` y `mongoexport`.
- Una API key de OpenWeather para consultar meteorología bajo demanda.

El repositorio incluye `.env.example` como plantilla de configuración. Para una ejecución completa hay que crear un `.env` real a partir de esa plantilla e informar una clave válida de OpenWeather.

## Instalación

Desde la raíz del repositorio API:

```bash
npm install
```

## Configuración

Crear un archivo `.env` en la raíz del proyecto API. Se puede partir de la plantilla incluida:

```bash
cp .env.example .env
```

Ejemplo:

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=proyectoFinalWeb
OPENWEATHER_API_KEY=tu_api_key_de_openweather
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
WEATHER_CACHE_TTL_MINUTES=60
```

Significado de las variables:

- `PORT`: puerto donde arranca la API REST. Por defecto, `3000`.
- `CLIENT_ORIGIN`: origen permitido para CORS. Por defecto, `http://localhost:5173`.
- `MONGODB_URI`: URI de conexión a MongoDB.
- `MONGODB_DB_NAME`: base de datos utilizada por la aplicación. En este proyecto se usa `proyectoFinalWeb`.
- `OPENWEATHER_API_KEY`: clave de acceso a OpenWeather.
- `OPENWEATHER_BASE_URL`: URL base de OpenWeather.
- `WEATHER_CACHE_TTL_MINUTES`: minutos durante los que se reutiliza el último registro meteorológico de una instalación antes de consultar de nuevo OpenWeather.

## Ejecución de MongoDB

La API necesita que MongoDB esté arrancado antes de iniciar el servidor.

Si se usa MongoDB local, la URI esperada es:

```text
mongodb://localhost:27017
```

La base de datos configurada para el proyecto es:

```text
proyectoFinalWeb
```

Antes de cargar datos desde OpenStreetMap o de consultar meteorología con OpenWeather, preparar MongoDB con esta secuencia:

1. Abrir una consola de MongoDB:

```bash
mongosh
```

2. Seleccionar la base de datos del proyecto. Si todavía no existe, MongoDB la creará cuando se cree la primera colección:

```javascript
use proyectoFinalWeb
```

3. Crear las colecciones necesarias dentro de esa base de datos:

```javascript
for (const collectionName of ["installations", "sports", "weather-records"]) {
  if (!db.getCollectionNames().includes(collectionName)) {
    db.createCollection(collectionName)
  }
}
```

4. Comprobar que se han creado correctamente:

```javascript
show collections
```

Después de estos pasos ya se puede importar el dataset JSON incluido o ejecutar el script de carga desde OpenStreetMap. La colección `weather-records` también se usará cuando se consulte el endpoint de meteorología de una instalación con OpenWeather.

## Carga de datos

El proyecto tiene dos formas de inicializar datos en MongoDB.

### Opción 1: importar el dataset JSON incluido

El repositorio incluye una exportación JSON en:

```text
data/installations.json
data/sports.json
data/weather-records.json
```

Contenido actual:

- `installations.json`: 1583 instalaciones deportivas.
- `sports.json`: 43 deportes.
- `weather-records.json`: 4 registros meteorológicos.

La colección `installations` supera los 1000 documentos, por lo que cubre el requisito de colección grande para búsquedas paginadas y filtradas.

Para importar estos datos en MongoDB:

```powershell
mongoimport --db=proyectoFinalWeb --collection=installations --file=data/installations.json --jsonArray
mongoimport --db=proyectoFinalWeb --collection=sports --file=data/sports.json --jsonArray
mongoimport --db=proyectoFinalWeb --collection=weather-records --file=data/weather-records.json --jsonArray
```

Si la base ya contiene datos y se quiere reconstruir desde cero:

```javascript
use proyectoFinalWeb
db.installations.deleteMany({})
db.sports.deleteMany({})
db["weather-records"].deleteMany({})
```

Después se pueden ejecutar de nuevo los comandos `mongoimport`.

### Opción 2: cargar datos desde OpenStreetMap

El proyecto incluye un script npm para cargar instalaciones desde OpenStreetMap mediante Overpass.

Ejemplo:

```bash
npm run import:osm -- --municipality=Getafe
```

También se puede indicar una base de datos concreta:

```bash
npm run import:osm -- --municipality=Getafe --db=proyectoFinalWeb
```

El importador:

- consulta instalaciones deportivas en OpenStreetMap;
- transforma los datos al modelo interno;
- crea o actualiza documentos en `installations`;
- crea o actualiza el catálogo `sports`;
- enlaza instalaciones con deportes mediante `sportId` y `name`;
- elimina instalaciones antiguas de ese municipio si ya no aparecen en la nueva carga;
- elimina registros de `weather-records` asociados a instalaciones eliminadas.

El proceso completo está documentado en:

```text
docs/script_cargaDatos.md
```

## Ejecución de la API REST

Modo desarrollo:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

URL local:

```text
http://localhost:3000
```

Comprobación rápida:

```http
GET http://localhost:3000/
```

Respuesta esperada:

```json
{
  "message": "Sports Facilities API is running"
}
```

## Documentación de la API

Swagger UI:

```text
http://localhost:3000/api-docs
```

Archivo OpenAPI:

```text
docs/openapi.yaml
```

Documento de diseño REST con ejemplos:

```text
docs/diseno_interfaz_rest.md
```

Modelo de datos:

```text
docs/modelo_datos.md
```

Schema XML de instalación:

```text
docs/schemas/installation.xsd
```

## Endpoints principales

- `GET /`
- `GET /installations`
- `POST /installations`
- `GET /installations/{id}`
- `PUT /installations/{id}`
- `DELETE /installations/{id}`
- `GET /installations/{id}/weather`
- `GET /sports`
- `POST /sports`
- `GET /sports/{id}`
- `PUT /sports/{id}`
- `PATCH /sports/{id}`
- `DELETE /sports/{id}`
- `GET /weather-records`
- `GET /weather-records/{id}`

## Formatos JSON y XML

La API responde en JSON por defecto.

El detalle de una instalación también puede devolverse en XML enviando la cabecera:

```http
Accept: application/xml
```

Ejemplo:

```http
GET /installations/{id}
Accept: application/xml
```

El schema asociado a esta respuesta está en:

```text
docs/schemas/installation.xsd
```

## API externa

El proyecto usa OpenWeather para consultar meteorología actual de una instalación.

Endpoint interno:

```http
GET /installations/{id}/weather
```

Funcionamiento:

- la API busca la instalación en MongoDB;
- toma sus coordenadas;
- si hay un registro meteorológico reciente, lo reutiliza;
- si no hay registro reciente, consulta OpenWeather solicitando XML con `mode=xml`;
- interpreta la respuesta XML externa;
- guarda el resultado en `weather-records`;
- devuelve el registro al cliente.

El cliente de esta API sigue recibiendo JSON en este endpoint. El XML se consume entre el backend y OpenWeather para cumplir el requisito de consumo externo en XML.

Si OpenWeather falla, la API responde con error controlado y el resto de endpoints siguen funcionando.

## Cliente web

El cliente se encuentra en el repositorio:

```text
ProyectoFinalWeb2-Cliente
```

Por defecto se ejecuta en:

```text
http://localhost:5173
```

El cliente espera que la API esté disponible en:

```text
http://localhost:3000
```

## Tests

Ejecutar la suite de tests:

```bash
npm test
```

## Estructura relevante

```text
ProyectoFinalWeb2/
  data/
    installations.json
    sports.json
    weather-records.json
  docs/
    diseno_interfaz_rest.md
    especificacion_proyecto.md
    modelo_datos.md
    openapi.yaml
    script_cargaDatos.md
    schemas/
      installation.xsd
  scripts/
    import-osm.js
  src/
    app.js
    server.js
```
