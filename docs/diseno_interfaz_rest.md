# Diseno de la interfaz REST

**Autores:** Equipo del proyecto: Ines Del Rio Garcia, Encarnacion Teresa Gonzalez Buitrago, Jesus Joana Azuara y Lucia Sorni Scaletti.

Este documento describe el diseno de la interfaz REST del proyecto `sports-facilities-api` e incluye ejemplos de mensajes de peticion y respuesta.

Complementa a los siguientes documentos, que ya estan elaborados dentro del repositorio:

- `docs/openapi.yaml`: contrato formal OpenAPI del servicio.
- `docs/especificacion_proyecto.md`: especificacion funcional y tecnica del proyecto.

La finalidad de este documento es explicar de forma narrativa como se organiza la API, que recursos expone, como se relacionan entre si y que mensajes intercambian cliente y servidor.

## 1. Informacion general

La API se ejecuta por defecto en:

```text
http://localhost:3000
```

El formato principal de intercambio es JSON. Ademas, el detalle de una instalacion permite respuesta XML mediante negociacion de contenido:

```http
Accept: application/xml
```

La API trabaja con tres recursos principales:

- `installations`: instalaciones deportivas.
- `sports`: catalogo global de deportes.
- `weather-records`: historico meteorologico asociado a instalaciones.

## 2. Convenciones REST

La interfaz sigue una estructura basada en recursos:

- `GET` consulta recursos.
- `POST` crea recursos.
- `PUT` sustituye o actualiza un recurso completo.
- `PATCH` aplica modificaciones parciales.
- `DELETE` elimina recursos.

Las rutas usan nombres en plural:

```text
/installations
/sports
/weather-records
```

Los identificadores son los `_id` generados por MongoDB.

## 3. Relacion entre recursos

Una instalacion puede tener varios deportes asociados. La relacion se guarda en el campo `sports` de cada instalacion mediante objetos con el identificador del deporte y su nombre:

```json
{
  "sportId": "663a7fb33d5f0f9f2df84c12",
  "name": "tennis"
}
```

Los registros meteorologicos se vinculan a una instalacion mediante `installationId`.

```json
{
  "installationId": "663a7f903d5f0f9f2df84c01"
}
```

El endpoint `GET /installations/{id}/weather` consulta datos meteorologicos externos, los transforma al modelo interno y los persiste como registros de `weather-records`.

## 4. Formato de errores

Los errores se devuelven en JSON con un mensaje descriptivo.

Ejemplo:

```json
{
  "status": 404,
  "message": "Installation not found"
}
```

Codigos habituales:

- `400 Bad Request`: parametros incorrectos o datos no validos.
- `404 Not Found`: recurso no encontrado.
- `409 Conflict`: conflicto con un recurso existente.
- `500 Internal Server Error`: error interno.
- `502 Bad Gateway`: error al consultar la API externa.

## 5. Recurso installations

### 5.1. Listar instalaciones

Permite consultar instalaciones con filtros y paginacion.

```http
GET /installations?city=Getafe&sport=tennis&page=1&limit=10 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

Respuesta:

```json
{
  "data": [
    {
      "_id": "663a7f903d5f0f9f2df84c01",
      "name": "Polideportivo Juan de la Cierva",
      "type": "sports_centre",
      "city": "Getafe",
      "source": "OpenStreetMap",
      "externalId": "way/123456",
      "sports": [
        {
          "sportId": "663a7fb33d5f0f9f2df84c12",
          "name": "tennis"
        }
      ],
      "location": {
        "type": "Point",
        "coordinates": [-3.7301, 40.3082]
      },
      "createdAt": "2026-05-02T11:36:21.406Z",
      "updatedAt": "2026-05-02T11:36:21.406Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 5.2. Crear instalacion

```http
POST /installations HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Accept: application/json
```

```json
{
  "name": "Centro Deportivo Municipal",
  "type": "sports_centre",
  "city": "Getafe",
  "source": "Manual",
  "sports": [
    {
      "sportId": "663a7fb33d5f0f9f2df84c12",
      "name": "tennis"
    }
  ],
  "location": {
    "type": "Point",
    "coordinates": [-3.724, 40.304]
  }
}
```

Respuesta:

```json
{
  "_id": "663a80143d5f0f9f2df84c22",
  "name": "Centro Deportivo Municipal",
  "type": "sports_centre",
  "city": "Getafe",
  "source": "Manual",
  "sports": [
    {
      "sportId": "663a7fb33d5f0f9f2df84c12",
      "name": "tennis"
    }
  ],
  "location": {
    "type": "Point",
    "coordinates": [-3.724, 40.304]
  },
  "createdAt": "2026-05-17T10:00:00.000Z",
  "updatedAt": "2026-05-17T10:00:00.000Z"
}
```

### 5.3. Consultar detalle en JSON

```http
GET /installations/663a80143d5f0f9f2df84c22 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

Respuesta:

```json
{
  "_id": "663a80143d5f0f9f2df84c22",
  "name": "Centro Deportivo Municipal",
  "type": "sports_centre",
  "city": "Getafe",
  "source": "Manual",
  "sports": [
    {
      "sportId": "663a7fb33d5f0f9f2df84c12",
      "name": "tennis"
    }
  ],
  "location": {
    "type": "Point",
    "coordinates": [-3.724, 40.304]
  }
}
```

### 5.4. Consultar detalle en XML

```http
GET /installations/663a80143d5f0f9f2df84c22 HTTP/1.1
Host: localhost:3000
Accept: application/xml
```

Respuesta:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<installation>
  <id>663a80143d5f0f9f2df84c22</id>
  <name>Centro Deportivo Municipal</name>
  <type>sports_centre</type>
  <city>Getafe</city>
  <source>Manual</source>
  <sports>
    <sportId>663a7fb33d5f0f9f2df84c12</sportId>
    <name>tennis</name>
  </sports>
  <location>
    <type>Point</type>
    <coordinates>-3.724</coordinates>
    <coordinates>40.304</coordinates>
  </location>
</installation>
```

La estructura formal de este XML queda descrita en:

```text
docs/schemas/installation.xsd
```

### 5.5. Actualizar instalacion

```http
PUT /installations/663a80143d5f0f9f2df84c22 HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Accept: application/json
```

```json
{
  "name": "Centro Deportivo Municipal Actualizado",
  "type": "sports_centre",
  "city": "Getafe",
  "source": "Manual",
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
  }
}
```

Respuesta:

```json
{
  "_id": "663a80143d5f0f9f2df84c22",
  "name": "Centro Deportivo Municipal Actualizado",
  "type": "sports_centre",
  "city": "Getafe",
  "source": "Manual",
  "sports": [
    {
      "sportId": "663a7fb33d5f0f9f2df84c12",
      "name": "tennis"
    },
    {
      "sportId": "663a7fc23d5f0f9f2df84c13",
      "name": "soccer"
    }
  ]
}
```

### 5.6. Eliminar instalacion

```http
DELETE /installations/663a80143d5f0f9f2df84c22 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

Respuesta:

```json
{
  "message": "Installation deleted"
}
```

### 5.7. Consultar meteorologia de una instalacion

Este endpoint consulta OpenWeather, crea o reutiliza un registro meteorologico y devuelve el resultado.

```http
GET /installations/663a80143d5f0f9f2df84c22/weather HTTP/1.1
Host: localhost:3000
Accept: application/json
```

Respuesta:

```json
{
  "_id": "663a81233d5f0f9f2df84c30",
  "installationId": "663a80143d5f0f9f2df84c22",
  "installationName": "Centro Deportivo Municipal Actualizado",
  "city": "Getafe",
  "temperature": 22.4,
  "humidity": 48,
  "condition": "clear",
  "windSpeed": 3.2,
  "source": "OpenWeather",
  "queryDate": "2026-05-17T10:05:00.000Z"
}
```

## 6. Recurso sports

### 6.1. Listar deportes

```http
GET /sports?missingMetadata=true&page=1&limit=10 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

Respuesta:

```json
{
  "data": [
    {
      "_id": "663a7fb33d5f0f9f2df84c12",
      "name": "tennis",
      "osmKey": "tennis",
      "category": null,
      "environment": "outdoor"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 6.2. Crear deporte

```http
POST /sports HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Accept: application/json
```

```json
{
  "name": "tennis",
  "osmKey": "tennis",
  "category": "racket",
  "environment": "outdoor"
}
```

Respuesta:

```json
{
  "_id": "663a7fb33d5f0f9f2df84c12",
  "name": "tennis",
  "osmKey": "tennis",
  "category": "racket",
  "environment": "outdoor"
}
```

### 6.3. Actualizar parcialmente un deporte

```http
PATCH /sports/663a7fb33d5f0f9f2df84c12 HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Accept: application/json
```

```json
{
  "category": "racket",
  "environment": "indoor"
}
```

Respuesta:

```json
{
  "_id": "663a7fb33d5f0f9f2df84c12",
  "name": "tennis",
  "osmKey": "tennis",
  "category": "racket",
  "environment": "indoor"
}
```

### 6.4. Eliminar deporte

```http
DELETE /sports/663a7fb33d5f0f9f2df84c12 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

Respuesta:

```json
{
  "message": "Sport deleted"
}
```

## 7. Recurso weather-records

### 7.1. Listar historico meteorologico

Permite filtrar por instalacion, condicion meteorologica y rango de fechas. Tambien permite ordenar y paginar.

```http
GET /weather-records?installationId=663a80143d5f0f9f2df84c22&condition=clear&dateFrom=2026-05-01&dateTo=2026-05-17&sortBy=queryDate&sortOrder=desc&page=1&limit=10 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

Respuesta:

```json
{
  "data": [
    {
      "_id": "663a81233d5f0f9f2df84c30",
      "installationId": "663a80143d5f0f9f2df84c22",
      "installationName": "Centro Deportivo Municipal Actualizado",
      "city": "Getafe",
      "temperature": 22.4,
      "humidity": 48,
      "condition": "clear",
      "windSpeed": 3.2,
      "source": "OpenWeather",
      "queryDate": "2026-05-17T10:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 7.2. Consultar detalle de registro meteorologico

```http
GET /weather-records/663a81233d5f0f9f2df84c30 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

Respuesta:

```json
{
  "_id": "663a81233d5f0f9f2df84c30",
  "installationId": "663a80143d5f0f9f2df84c22",
  "installationName": "Centro Deportivo Municipal Actualizado",
  "city": "Getafe",
  "temperature": 22.4,
  "humidity": 48,
  "condition": "clear",
  "windSpeed": 3.2,
  "source": "OpenWeather",
  "queryDate": "2026-05-17T10:05:00.000Z"
}
```

## 8. Endpoint raiz

```http
GET / HTTP/1.1
Host: localhost:3000
Accept: application/json
```

Respuesta:

```json
{
  "message": "Sports Facilities API"
}
```

## 9. Carga de datos

La carga de datos desde OpenStreetMap no forma parte de la interfaz REST publica. Se realiza mediante script de npm y esta documentada en:

```text
docs/script_cargaDatos.md
```

El script permite inicializar las colecciones `installations` y `sports` a partir de datos externos de OpenStreetMap.

## 10. Documentacion formal de la API

La descripcion formal de rutas, parametros, cuerpos de peticion, codigos de respuesta y esquemas se encuentra en:

```text
docs/openapi.yaml
```

Cuando el servidor esta en ejecucion, la documentacion Swagger puede consultarse en:

```text
http://localhost:3000/api-docs
```
