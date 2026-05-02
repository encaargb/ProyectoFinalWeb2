# Especificación del Proyecto

## 1. Propósito

`sports-facilities-api` es una API REST para consultar instalaciones deportivas, deportes asociados y registros meteorológicos vinculados a instalaciones concretas.

Este documento es la fuente única de verdad funcional y técnica del proyecto. Sustituye a cualquier documentación previa que entre en conflicto con lo aquí definido.

## 2. Alcance

El sistema incluye:

- API pública HTTP para consulta y gestión básica de recursos.
- Persistencia en MongoDB.
- Carga manual de instalaciones deportivas desde OpenStreetMap mediante scripts ejecutados por consola.
- Enriquecimiento meteorológico bajo demanda para instalaciones concretas.

El sistema no incluye:

- Endpoints HTTP públicos para importación o sincronización masiva.
- Frontend dentro de este repositorio.
- Automatismos programados de actualización periódica.

## 2.1. Situación actual del proyecto

La implementación actual ya cubre la mayor parte del contrato definido:

- `installations` permite listado, detalle, creación, actualización y borrado.
- `installations` guarda deportes asociados como objetos con `sportId` y `name`.
- `sports` funciona como catálogo global con CRUD completo y filtro `missingMetadata=true`.
- `weather-records` permite consulta de histórico con filtros, paginación y ordenación.
- `GET /installations/{id}/weather` consulta OpenWeather bajo demanda, reutiliza registros vigentes y persiste nuevos registros cuando corresponde.
- `docs/openapi.yaml` documenta los recursos públicos aprobados.
- el importador OSM carga instalaciones y también crea o actualiza deportes del catálogo a partir del tag `sport`.

Quedan como líneas principales de trabajo:

- completar o revisar búsqueda textual avanzada `q` en `GET /installations`;
- revisar la política de recarga completa por municipio y eliminación de registros huérfanos;
- preparar un script o flujo específico para revisar deportes incompletos;
- revisar índices, mensajes, ejemplos OpenAPI y coherencia final entre API y cliente.

## 3. Reglas generales del sistema

- La API pública responde en español.
- La carga de instalaciones se realiza únicamente mediante scripts manuales lanzados con `npm` desde entorno local.
- La carga por localidad trabaja a nivel de municipio exacto en OpenStreetMap, usando `admin_level=8`.
- Los endpoints HTTP `/external/*` no forman parte del contrato público del sistema.
- La siguiente fase de evolución del proyecto deberá adaptar implementación y tests a esta especificación, sin reabrir las decisiones aquí cerradas.
- Los listados públicos que admitan paginación usarán `page` y `limit`.
- Los listados públicos que admitan ordenación usarán `sortBy` y `sortOrder`.

## 4. Modelo de datos

### 4.1. Colección `sports`

Representa deportes normalizados del sistema.

Campos:

- `name`: obligatorio.
- `osmKey`: obligatorio si el deporte procede o puede mapearse desde OSM.
- `category`: opcional, puede ser `null`.
- `environment`: opcional, puede ser `null`.
- `createdAt`: auditoría.
- `updatedAt`: auditoría.

Reglas:

- Si durante una carga de instalaciones aparece un deporte nuevo, se crea automáticamente en esta colección.
- Los deportes nuevos creados automáticamente deben persistirse con:
  - `name` obligatorio.
  - `osmKey` si existe en OSM.
  - `category = null`.
  - `environment = null` cuando no pueda inferirse desde OSM.
- Existirá un script manual específico para completar deportes incompletos.
- La identificación funcional para revisar/completar deportes pendientes será `name + osmKey`, con el objetivo de evitar repeticiones por nombre.
- La API pública permitirá gestionar deportes completos mediante operaciones CRUD.
- Un deporte se considera incompleto si `category` o `environment` son `null`.

### 4.2. Colección `installations`

Representa instalaciones deportivas.

Campos:

- `name`: obligatorio.
- `type`: obligatorio.
- `city`: obligatorio.
- `sports`: opcional.
- `location`: obligatorio al persistir.
- `externalId`: opcional.
- `source`: obligatorio al persistir.
- `lastUpdated`: opcional.
- `createdAt`: auditoría.
- `updatedAt`: auditoría.

Estructuras embebidas:

- `sports[]`
  - `sportId`
  - `name`

- `location`
  - `type`
  - `coordinates`

Reglas:

- `city` representa el municipio cargado.
- Las cargas por localidad se realizan exclusivamente a nivel de municipio OSM (`admin_level=8`).
- En altas manuales de instalaciones, si no se proporcionan coordenadas, el sistema intentará autocompletarlas como hace actualmente.
- `sports` en una instalación almacena referencias denormalizadas con `sportId + name`.
- La API pública permitirá búsqueda textual avanzada mediante `q`, aplicable sobre `name`, `type` y `city`.

### 4.3. Colección `weather-records`

Representa histórico meteorológico asociado a instalaciones.

Campos:

- `installationId`: obligatorio.
- `queryDate`: obligatorio.
- `temperature`: obligatorio.
- `condition`: obligatorio.
- `humidity`: opcional.
- `windspeed`: opcional.
- `createdAt`: auditoría.
- `updatedAt`: auditoría.

Reglas:

- La colección mantiene histórico de datos.
- Los registros meteorológicos se asocian a una instalación concreta, no directamente a una localidad.
- La API pública permitirá consultar histórico con filtros, paginación y ordenación.

## 5. Cargas manuales y sincronización

### 5.1. Carga de instalaciones por localidad

Existirá un script manual para cargar instalaciones por localidad.

Contrato funcional:

- La carga se dispara manualmente mediante `npm`.
- La localidad objetivo debe interpretarse como municipio exacto.
- La consulta a OpenStreetMap debe resolverse contra `admin_level=8`.
- La carga reconstruye las instalaciones del municipio solicitado.

### 5.2. Política de recarga

Cuando se relanza una carga de una localidad ya existente:

- se reemplazan las instalaciones de ese municipio;
- deben eliminarse los registros huérfanos asociados a instalaciones ya inexistentes en base de datos.

### 5.3. Deportes detectados durante la carga

Cuando una instalación cargada desde OSM contiene deportes detectados:

- si el deporte ya existe, se enlaza en `installations.sports` mediante `sportId + name`;
- si el deporte no existe, se crea automáticamente en `sports`;
- `category` queda pendiente de revisión manual cuando OSM no aporta una clasificación suficiente;
- `environment` puede inferirse como `indoor` u `outdoor` si OSM contiene información suficiente; si no, queda a `null`.

### 5.4. Script de revisión de deportes incompletos

Existirá un script manual independiente para completar o corregir deportes incompletos detectados tras actualizaciones de instalaciones.

Su función será:

- localizar deportes pendientes;
- completar los campos faltantes, especialmente `category` y `environment`;
- identificar los registros funcionalmente por `name + osmKey`.

## 6. Contrato de meteorología

### 6.1. Consulta por instalación

El endpoint `GET /installations/:id/weather` opera sobre una instalación concreta identificada por su `_id` de MongoDB.

No opera por nombre de localidad.

### 6.2. Resolución bajo demanda

Cada vez que se consulta el clima de una instalación:

- si existe un registro vigente en base de datos, se devuelve ese registro;
- si no existe o está caducado, se consulta el servicio meteorológico externo;
- la nueva información obtenida se registra en base de datos;
- el histórico previo se conserva.

Reglas de vigencia:

- la vigencia se calculará sobre `queryDate`;
- el registro de referencia será siempre el más reciente de la instalación, ordenado por `queryDate desc`;
- la vigencia por defecto será de `60 minutos`;
- el valor real de vigencia será configurable por entorno mediante `WEATHER_CACHE_TTL_MINUTES`.

Reglas de resolución:

- si el identificador de instalación no tiene formato válido de MongoDB, el endpoint devolverá `400`;
- si la instalación no existe, el endpoint devolverá `404`;
- si la instalación existe pero no tiene coordenadas válidas, el endpoint devolverá `400`;
- si no existe ningún `weather-record` previo para la instalación, se consultará el proveedor externo, se persistirá un nuevo registro y se devolverá `200`;
- si existe un registro vigente, se devolverá ese mismo registro con `200`;
- si el último registro está caducado, se consultará el proveedor externo, se persistirá un nuevo documento y se devolverá `200`.

Reglas de integración con proveedor externo:

- el proveedor acordado para esta fase es OpenWeather;
- se utilizará `Current Weather API`;
- la integración se configurará con:
  - `OPENWEATHER_API_KEY`
  - `OPENWEATHER_BASE_URL`
  - `WEATHER_CACHE_TTL_MINUTES`
- el valor base recomendado para `OPENWEATHER_BASE_URL` será `https://api.openweathermap.org/data/2.5`;
- la consulta al proveedor se hará por coordenadas de la instalación;
- se usarán `units=metric` y `lang=es`.

Mapeo acordado de respuesta externa a `weather-records`:

- `installationId` <- `_id` de la instalación
- `queryDate` <- hora actual del servidor en el momento de la consulta
- `temperature` <- `main.temp`
- `condition` <- `weather[0].description`
- `humidity` <- `main.humidity`
- `windspeed` <- `wind.speed`

Reglas de validación de respuesta externa:

- `temperature` y `condition` son obligatorios para aceptar la respuesta del proveedor;
- si falta cualquiera de ellos, el endpoint devolverá `502`;
- `humidity` y `windspeed` son opcionales y se persistirán como `null` si no vienen informados.

Reglas de error:

- si falta configuración interna necesaria para la integración meteorológica, el endpoint devolverá `500`;
- si el proveedor externo falla o devuelve una respuesta inválida, el endpoint devolverá `502`;
- los mensajes de error de la API pública se mantendrán en español.

### 6.3. Ausencia de script específico de weather

No se requiere un script manual específico para meteorología, ya que la obtención y persistencia del clima se resuelve bajo demanda cuando se consulta una instalación.

## 7. API pública

Los únicos recursos públicos aprobados en esta fase son:

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

No forman parte de la API pública:

- `/external/import/installations`
- `/external/import/weather`
- cualquier otro endpoint no descrito en este documento

## 8. Reglas de documentación y contrato

- `docs/openapi.yaml` debe reflejar exclusivamente la API pública definida en esta especificación.
- OpenAPI no debe documentar operaciones de importación HTTP.
- OpenAPI debe reflejar que `GET /installations/{id}/weather` usa el `_id` de la instalación.
- OpenAPI debe describir `sports` embebido en instalaciones como un array de objetos con `sportId` y `name`.
- OpenAPI debe reflejar la búsqueda textual `q` en `GET /installations`.
- OpenAPI debe reflejar el CRUD completo aprobado para `sports`.
- OpenAPI debe reflejar filtros, paginación y ordenación en `GET /weather-records`.
- Si existiera conflicto entre documentación histórica y este documento, prevalece esta especificación.

## 9. Contrato detallado de consultas públicas

### 9.1. `GET /installations`

Permite:

- paginación con `page` y `limit`;
- filtros directos por `name`, `city`, `type` y `sport`;
- búsqueda textual avanzada mediante `q`.

Reglas:

- `q` busca de forma textual sobre `name`, `type` y `city`;
- `q` puede convivir con el resto de filtros;
- la documentación y los tests deberán reflejar con precisión cómo se combinan estos filtros.

### 9.1.b. `GET /installations/{id}/weather`

Devuelve exclusivamente el `weather-record` resuelto para la instalación indicada.

Formato de respuesta exitosa:

- `{ "data": { ...weatherRecord } }`

Formato de error:

- `{ "status": number, "message": string }`

### 9.2. `GET /sports`

Permite:

- listado general;
- filtro `missingMetadata=true` para devolver deportes incompletos.

### 9.3. `GET /weather-records`

Permite:

- filtro por `installationId`;
- filtro por rango temporal con `dateFrom` y `dateTo`;
- filtro por `condition`;
- paginación con `page` y `limit`;
- ordenación con `sortBy` y `sortOrder`.

Reglas:

- `installationId` referencia una instalación concreta;
- `dateFrom` y `dateTo` acotan `queryDate`;
- `sortBy` solo podrá aplicarse sobre campos permitidos por la implementación y documentados en OpenAPI.

### 9.4. `PATCH /sports/{id}`

Regla funcional:

- `PATCH` realiza actualización parcial;
- solo se enviarán los campos que cambian;
- no exige documento completo como sí puede hacerlo `PUT`.

## 10. Evolución posterior

La siguiente fase del proyecto consistirá en:

- cerrar la búsqueda textual avanzada `q` en instalaciones si falta algún ajuste;
- reforzar la recarga por municipio y la eliminación de datos huérfanos;
- crear o documentar el flujo de revisión de deportes incompletos;
- revisar índices de MongoDB;
- hacer una revisión final de OpenAPI, README, tests y mensajes de error.
