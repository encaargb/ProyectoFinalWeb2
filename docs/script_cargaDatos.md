# Script de Carga de Datos

Este documento describe la forma actualmente implementada para cargar datos en MongoDB desde OpenStreetMap.

La carga se realiza desde el repositorio de la API, `ProyectoFinalWeb2`, mediante un script de consola. No existe un endpoint HTTP público para importar datos.

## 1. Script disponible

El script se ejecuta con:

```bash
npm run import:osm -- --municipality=Getafe
```

Internamente ejecuta:

```bash
node scripts/import-osm.js
```

El script:

- conecta con MongoDB;
- consulta OpenStreetMap mediante Overpass;
- transforma los elementos OSM al modelo interno;
- actualiza la colección `installations`;
- actualiza la colección `sports`;
- elimina instalaciones OSM obsoletas del municipio;
- elimina registros meteorológicos asociados a instalaciones eliminadas.

## 2. Requisitos previos

Antes de ejecutar el script debe existir configuración de MongoDB.

Variables de entorno necesarias:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=sports_facilities
```

También se puede indicar la base de datos por parámetro con `--db`, en cuyo caso se usa ese nombre en lugar de `MONGODB_DB_NAME`.

Ejemplo:

```bash
npm run import:osm -- --municipality=Getafe --db=sports_facilities_test
```

## 3. Parámetros disponibles

### `--municipality`

Obligatorio.

Indica el municipio exacto que se quiere cargar desde OpenStreetMap.

Ejemplo:

```bash
npm run import:osm -- --municipality=Getafe
```

El script busca una relación administrativa de OSM con:

- `boundary=administrative`;
- `admin_level=8`;
- `name=<municipio indicado>`.

Después usa el área de ese municipio para buscar instalaciones deportivas.

### `--zone`

Alias de `--municipality`.

Está soportado actualmente por compatibilidad interna:

```bash
npm run import:osm -- --zone=Getafe
```

Se recomienda usar `--municipality`, porque expresa mejor el contrato actual.

### `--db`

Opcional.

Permite indicar la base de datos MongoDB donde se hará la carga.

Ejemplo:

```bash
npm run import:osm -- --municipality=Getafe --db=sports_facilities_test
```

Si no se indica, se usa la base definida en `MONGODB_DB_NAME`.

### `--overpassUrl`

Opcional.

Permite forzar una instancia concreta de Overpass.

Ejemplo:

```bash
npm run import:osm -- --municipality=Getafe --overpassUrl=https://overpass-api.de/api/interpreter
```

Si no se indica, el sistema prueba automáticamente estas instancias:

- `https://overpass-api.de/api/interpreter`;
- `https://overpass.private.coffee/api/interpreter`.

Si la primera falla, intenta la siguiente.

### `--timeoutMs`

Opcional.

Indica el tiempo máximo de espera para la consulta a Overpass, en milisegundos.

Valor por defecto:

```text
45000
```

Ejemplo:

```bash
npm run import:osm -- --municipality=Getafe --timeoutMs=60000
```

Debe ser un entero mayor o igual que `1000`.

## 4. Qué datos se consultan en OSM

La consulta actual busca dentro del municipio:

- `leisure=sports_centre`;
- `leisure=pitch`;
- `leisure=stadium`;
- `leisure=track`;
- `leisure=fitness_station`;
- `amenity=sports_centre`.

Se consultan nodos, ways y relaciones.

Para ways y relaciones se solicita el centro geométrico con `out center tags`, de forma que también puedan guardarse coordenadas cuando el elemento no sea un nodo.

## 5. Transformación a `installations`

Cada elemento OSM válido se convierte en una instalación.

Se descartan elementos que no tengan coordenadas ni centro geométrico.

Campos principales generados:

- `name`: nombre OSM si existe; si no existe, se crea un nombre técnico.
- `type`: se infiere desde `leisure`, `amenity`, `building` o `sports_facility`.
- `city`: municipio indicado en `--municipality`.
- `sports`: deportes detectados en el tag OSM `sport`.
- `location`: GeoJSON `Point` con coordenadas.
- `externalId`: identificador técnico con formato `type/id`, por ejemplo `node/123`.
- `source`: siempre `OpenStreetMap`.
- `lastUpdated`: fecha de la importación.

Los deportes de una instalación se normalizan a partir del tag `sport`.

Si OSM trae varios deportes separados por `;` o `,`, se separan y se eliminan duplicados.

Ejemplo:

```text
sport=tennis;soccer
```

Se transforma inicialmente en:

```json
[
  { "name": "tennis", "osmKey": "tennis", "category": null, "environment": null },
  { "name": "soccer", "osmKey": "soccer", "category": null, "environment": null }
]
```

Después, antes de guardar la instalación, se intenta enlazar cada deporte con el catálogo `sports`. Si existe o se acaba de crear el deporte, en la instalación se guarda:

```json
[
  { "name": "tennis", "sportId": "..." }
]
```

## 6. Transformación a `sports`

Durante la carga se extrae un catálogo de deportes desde las instalaciones importadas.

Cada deporte detectado en OSM se guarda o actualiza en la colección `sports`.

Campos generados:

- `name`: nombre del deporte detectado.
- `osmKey`: clave OSM del deporte, normalmente igual al nombre detectado.
- `category`: `null`, porque OSM no aporta directamente la categoría interna del proyecto.
- `environment`: puede inferirse desde OSM o quedar a `null`.

Reglas de inferencia de `environment`:

- `indoor` si `indoor=yes`;
- `outdoor` si `indoor=no`;
- `outdoor` si la instalación es `leisure=pitch`;
- `outdoor` si la instalación es `leisure=track`;
- `outdoor` si la instalación es `leisure=stadium`;
- `null` si no hay información suficiente.

Si el deporte ya existe en `sports` con el mismo `osmKey`, no se sobrescriben sus metadatos principales. Se actualiza `updatedAt`, pero se mantienen valores ya revisados como `name`, `category` y `environment`.

Esto es importante porque permite completar manualmente el catálogo sin que una recarga OSM borre ese trabajo.

## 7. Política de recarga

La carga está pensada como una recarga por municipio.

Para el municipio indicado:

1. Se consulta OSM.
2. Se transforman las instalaciones válidas.
3. Se obtiene la lista de `externalId` que siguen existiendo en la nueva carga.
4. Se eliminan de MongoDB las instalaciones antiguas que cumplan:
   - `city = <municipio>`;
   - `source = OpenStreetMap`;
   - `externalId` no está en la nueva carga.
5. Se eliminan los `weather-records` asociados a esas instalaciones eliminadas.
6. Se crean o actualizan los deportes del catálogo.
7. Se crean o actualizan las instalaciones actuales.

La actualización de instalaciones se hace por:

```json
{
  "externalId": "...",
  "source": "OpenStreetMap"
}
```

Si ya existe, se actualiza.

Si no existe, se inserta.

## 8. Qué se mantiene tras una recarga

Se mantienen:

- instalaciones OSM del mismo municipio que sigan apareciendo en la nueva carga;
- sus `_id` existentes, porque se actualizan con `upsert` sobre `externalId + source`;
- sus `createdAt` originales;
- registros `weather-records` de instalaciones que siguen existiendo;
- deportes del catálogo `sports` ya existentes;
- metadatos manuales ya completados en `sports`, como `category` y `environment`;
- instalaciones manuales cuyo `source` no sea `OpenStreetMap`;
- instalaciones de otros municipios.

Se actualizan:

- datos de instalaciones OSM que siguen existiendo;
- `updatedAt` de instalaciones actualizadas;
- `lastUpdated` de instalaciones importadas;
- `updatedAt` de deportes detectados durante la carga.

Se eliminan:

- instalaciones OSM del municipio importado que ya no aparezcan en la nueva respuesta de OSM;
- registros `weather-records` asociados a esas instalaciones eliminadas.

No se eliminan automáticamente:

- deportes del catálogo que ya no aparezcan en una carga concreta;
- instalaciones manuales;
- registros meteorológicos de instalaciones que siguen existiendo;
- datos de otros municipios.

## 9. Resultado de la carga

Al finalizar, el script imprime un JSON con estadísticas.

Ejemplo de formato:

```json
{
  "municipality": "Getafe",
  "fetched": 120,
  "imported": 95,
  "sportsCatalog": {
    "received": 8,
    "inserted": 2,
    "updated": 6
  },
  "cleanup": {
    "removedInstallations": 3,
    "removedWeatherRecords": 12
  },
  "received": 95,
  "inserted": 10,
  "updated": 85
}
```

Significado:

- `municipality`: municipio cargado.
- `fetched`: elementos crudos recibidos desde OSM.
- `imported`: instalaciones válidas generadas tras transformar y descartar elementos sin coordenadas.
- `sportsCatalog.received`: deportes únicos detectados para catálogo.
- `sportsCatalog.inserted`: deportes nuevos insertados.
- `sportsCatalog.updated`: deportes existentes detectados durante la carga.
- `cleanup.removedInstallations`: instalaciones OSM antiguas eliminadas.
- `cleanup.removedWeatherRecords`: registros meteorológicos eliminados por pertenecer a instalaciones obsoletas.
- `received`: instalaciones enviadas a persistencia.
- `inserted`: instalaciones nuevas insertadas.
- `updated`: instalaciones existentes actualizadas.

## 10. Ejemplos de uso

### Cargar Getafe en la base configurada por `.env`

```bash
npm run import:osm -- --municipality=Getafe
```

### Cargar Getafe en una base de pruebas

```bash
npm run import:osm -- --municipality=Getafe --db=sports_facilities_test
```

### Usar una instancia concreta de Overpass

```bash
npm run import:osm -- --municipality=Getafe --overpassUrl=https://overpass-api.de/api/interpreter
```

### Aumentar el timeout

```bash
npm run import:osm -- --municipality=Getafe --timeoutMs=60000
```

## 11. Vaciar la base de datos antes de cargar

Si se quiere empezar desde cero, se puede vaciar manualmente la base de datos desde `mongosh`.

Seleccionar la base correcta:

```javascript
use sports_facilities
```

Borrar colecciones principales:

```javascript
db.installations.deleteMany({})
db.sports.deleteMany({})
db["weather-records"].deleteMany({})
```

Después lanzar de nuevo:

```bash
npm run import:osm -- --municipality=Getafe
```

Hay que tener cuidado con `deleteMany({})`, porque borra todos los documentos de la colección seleccionada.

## 12. Limitaciones actuales

- La carga depende de la disponibilidad de Overpass.
- El nombre del municipio debe coincidir con el `name` de la relación administrativa OSM.
- Solo se importan instalaciones deportivas cubiertas por los filtros OSM actuales.
- No se eliminan deportes del catálogo aunque dejen de aparecer en una recarga.
- No existe todavía un script específico para revisar y completar deportes incompletos.
- La importación es manual; no hay sincronización automática programada.
