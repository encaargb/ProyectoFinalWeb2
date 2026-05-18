# Modelo de datos de la base de datos

**Autores:** Equipo del proyecto: Ines Del Rio Garcia, Encarnacion Teresa Gonzalez Buitrago, Jesus Joana Azuara y Lucia Sorni Scaletti.

Este documento describe el modelo de datos actualmente implementado en MongoDB para el proyecto `sports-facilities-api`.

La aplicacion utiliza el driver nativo de MongoDB. Por tanto, no hay esquemas Mongoose activos para las colecciones principales; la estructura se controla desde validadores, repositorios, controladores y servicios.

Colecciones principales:

- `installations`
- `sports`
- `weather-records`

## 1. Consideraciones generales

MongoDB almacena los identificadores internos en el campo `_id` con tipo `ObjectId`.

En las respuestas de la API, los controladores transforman `_id` a `id` para que el cliente trabaje con una estructura mas comoda. Esto significa que:

- en base de datos el campo real es `_id`;
- en la respuesta REST normalmente aparece como `id`.

Ejemplo en MongoDB:

```json
{
  "_id": "663a80143d5f0f9f2df84c22"
}
```

Ejemplo en la API:

```json
{
  "id": "663a80143d5f0f9f2df84c22"
}
```

Los campos `createdAt` y `updatedAt` se generan en la capa de repositorio cuando se crean o actualizan documentos.

## 2. Coleccion installations

La coleccion `installations` almacena las instalaciones deportivas.

Puede contener instalaciones importadas desde OpenStreetMap o creadas manualmente desde la API o el cliente web.

### 2.1. Campos

| Campo | Tipo | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `_id` | ObjectId | Si | Identificador unico generado por MongoDB. |
| `name` | String | Si | Nombre de la instalacion. |
| `type` | String | Si | Tipo de instalacion, por ejemplo `sports_centre`, `pitch`, `stadium`, `track` o `fitness_station`. |
| `city` | String | Si | Municipio o ciudad de la instalacion. |
| `sports` | Array | No | Deportes asociados a la instalacion. Si no se informa, se guarda como array vacio. |
| `sports[].sportId` | String | No | Identificador del deporte en la coleccion `sports`. |
| `sports[].name` | String | Si, si existe el elemento | Nombre del deporte asociado. |
| `location` | Object | No | Localizacion en formato GeoJSON simplificado. |
| `location.type` | String | No | Actualmente se espera `Point`. |
| `location.coordinates` | Array<Number> | No | Coordenadas `[longitud, latitud]`. |
| `externalId` | String/null | No | Identificador externo del dato, por ejemplo `node/123`, `way/456` o `relation/789` de OSM. |
| `source` | String | No | Origen del dato. Por defecto `manual`; en importaciones se usa `OpenStreetMap`. |
| `lastUpdated` | Date | No | Fecha de ultima actualizacion funcional del dato. |
| `createdAt` | Date | Si | Fecha de creacion del documento en MongoDB. |
| `updatedAt` | Date | Si | Fecha de ultima actualizacion del documento en MongoDB. |

### 2.2. Ejemplo

```json
{
  "_id": "663a80143d5f0f9f2df84c22",
  "name": "Centro Deportivo Municipal",
  "type": "sports_centre",
  "city": "Getafe",
  "sports": [
    {
      "sportId": "663a7fb33d5f0f9f2df84c12",
      "name": "tennis"
    },
    {
      "sportId": "663a7fc23d5f0f9f2df84c13",
      "name": "soccer"
    }
  ],
  "location": {
    "type": "Point",
    "coordinates": [-3.724, 40.304]
  },
  "externalId": "way/123456",
  "source": "OpenStreetMap",
  "lastUpdated": "2026-05-17T10:00:00.000Z",
  "createdAt": "2026-05-17T10:00:00.000Z",
  "updatedAt": "2026-05-17T10:00:00.000Z"
}
```

### 2.3. Reglas de validacion

Para crear o actualizar una instalacion mediante la API:

- `name`, `type` y `city` son obligatorios y deben ser textos no vacios.
- `sports` debe ser un array.
- cada elemento de `sports` debe tener `name`;
- `sportId`, si se informa, debe ser texto no vacio;
- `location`, si se informa, debe tener `type: "Point"` y exactamente dos coordenadas numericas;
- `externalId`, si se informa, debe ser texto no vacio;
- `source`, si se informa, debe ser texto no vacio;
- `lastUpdated`, si se informa, debe ser una fecha valida.

## 3. Coleccion sports

La coleccion `sports` almacena el catalogo global de deportes.

El catalogo puede alimentarse automaticamente durante la carga desde OpenStreetMap y tambien puede mantenerse desde la API o el cliente web.

### 3.1. Campos

| Campo | Tipo | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `_id` | ObjectId | Si | Identificador unico generado por MongoDB. |
| `name` | String | Si | Nombre del deporte dentro del catalogo. |
| `osmKey` | String/null | No | Clave utilizada por OpenStreetMap para representar el deporte. |
| `category` | String/null | No | Categoria funcional del deporte, por ejemplo `racket`, `team` o `water`. |
| `environment` | String/null | No | Entorno habitual, por ejemplo `indoor` u `outdoor`. |
| `createdAt` | Date | Si | Fecha de creacion del documento en MongoDB. |
| `updatedAt` | Date | Si | Fecha de ultima actualizacion del documento en MongoDB. |

### 3.2. Ejemplo

```json
{
  "_id": "663a7fb33d5f0f9f2df84c12",
  "name": "tennis",
  "osmKey": "tennis",
  "category": "racket",
  "environment": "outdoor",
  "createdAt": "2026-05-17T10:00:00.000Z",
  "updatedAt": "2026-05-17T10:00:00.000Z"
}
```

### 3.3. Reglas de validacion

Para crear o actualizar un deporte:

- `name` es obligatorio en `POST` y `PUT`;
- en `PATCH`, `name` solo se valida si se envia;
- `osmKey`, `category` y `environment` pueden ser `null`;
- si `osmKey`, `category` o `environment` se informan con valor distinto de `null`, deben ser textos no vacios.

Un deporte se considera incompleto para revision si tiene:

- `category: null`;
- o `environment: null`.

Ese criterio se usa en el filtro:

```text
GET /sports?missingMetadata=true
```

## 4. Coleccion weather-records

La coleccion `weather-records` almacena el historico meteorologico consultado para las instalaciones.

Los registros se crean a partir del endpoint:

```text
GET /installations/{id}/weather
```

Ese endpoint consulta OpenWeather cuando no existe un registro reciente en cache para la instalacion.

### 4.1. Campos

| Campo | Tipo | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `_id` | ObjectId | Si | Identificador unico generado por MongoDB. |
| `installationId` | ObjectId | Si | Referencia a la instalacion consultada. |
| `queryDate` | Date | Si | Fecha y hora de la consulta meteorologica. |
| `temperature` | Number | Si | Temperatura en grados Celsius. |
| `condition` | String | Si | Descripcion meteorologica recibida de OpenWeather. |
| `humidity` | Number/null | No | Humedad recibida de OpenWeather. |
| `windspeed` | Number/null | No | Velocidad del viento recibida de OpenWeather. |
| `createdAt` | Date | Si | Fecha de creacion del documento en MongoDB. |
| `updatedAt` | Date | Si | Fecha de ultima actualizacion del documento en MongoDB. |

### 4.2. Ejemplo

```json
{
  "_id": "663a81233d5f0f9f2df84c30",
  "installationId": "663a80143d5f0f9f2df84c22",
  "queryDate": "2026-05-17T10:05:00.000Z",
  "temperature": 22.4,
  "condition": "cielo claro",
  "humidity": 48,
  "windspeed": 3.2,
  "createdAt": "2026-05-17T10:05:00.000Z",
  "updatedAt": "2026-05-17T10:05:00.000Z"
}
```

### 4.3. Reglas de consulta

El historico meteorologico permite:

- filtrar por `installationId`;
- filtrar por `condition`;
- filtrar por rango de fechas usando `dateFrom` y `dateTo`;
- ordenar por `queryDate`, `temperature` o `createdAt`;
- usar `sortOrder=asc` o `sortOrder=desc`;
- paginar con `page` y `limit`.

El limite maximo de pagina es `100`.

## 5. Relaciones entre colecciones

### 5.1. installations y sports

La relacion entre instalaciones y deportes se guarda dentro de cada instalacion en el array `sports`.

Ejemplo:

```json
{
  "sports": [
    {
      "sportId": "663a7fb33d5f0f9f2df84c12",
      "name": "tennis"
    }
  ]
}
```

`sportId` apunta al `_id` de un documento de la coleccion `sports`.

Tambien se guarda `name` de forma denormalizada para que la instalacion conserve el nombre del deporte asociado y para facilitar consultas por `sports.name`.

### 5.2. installations y weather-records

Cada registro meteorologico tiene un `installationId` que apunta a la instalacion consultada.

Ejemplo:

```json
{
  "installationId": "663a80143d5f0f9f2df84c22"
}
```

La relacion se utiliza para:

- consultar el historico meteorologico de una instalacion;
- reutilizar el ultimo registro si sigue dentro del tiempo de cache configurado;
- borrar registros meteorologicos asociados a instalaciones antiguas durante ciertas cargas de datos.

## 6. Origen de los datos

### 6.1. OpenStreetMap

El script de carga de datos importa instalaciones desde OpenStreetMap.

Durante la importacion:

- se crean o actualizan instalaciones en `installations`;
- se extraen los deportes detectados en las etiquetas OSM;
- se crean o actualizan deportes en `sports`;
- se enlazan las instalaciones con los deportes del catalogo mediante `sportId` y `name`.

El campo `externalId` permite mantener la referencia al elemento original de OpenStreetMap.

### 6.2. OpenWeather

OpenWeather se utiliza para consultar meteorologia actual de una instalacion.

La respuesta externa se transforma al modelo interno de `weather-records`, conservando:

- temperatura;
- descripcion meteorologica;
- humedad;
- velocidad del viento;
- fecha de consulta.

## 7. Datos que se mantienen tras las cargas

Tras ejecutar el script de importacion desde OpenStreetMap se mantienen:

- las instalaciones importadas del municipio o zona consultada;
- el catalogo de deportes detectado en las instalaciones;
- las relaciones entre instalaciones y deportes.

Los registros de `weather-records` se generan posteriormente cuando se consulta la meteorologia de una instalacion.

En determinadas recargas, si se eliminan instalaciones obsoletas del municipio importado, tambien se eliminan los registros meteorologicos asociados a esas instalaciones para evitar historicos sin instalacion relacionada.

## 8. Resumen del modelo

```text
installations
  |_ sports[].sportId  --->  sports._id

weather-records.installationId  --->  installations._id
```

Este modelo permite:

- consultar instalaciones deportivas;
- mantener un catalogo independiente de deportes;
- asociar varios deportes a una misma instalacion;
- consultar y conservar historico meteorologico por instalacion.
