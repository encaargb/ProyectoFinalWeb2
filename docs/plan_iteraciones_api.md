# Plan de Iteraciones de la API

Este documento organiza las siguientes iteraciones funcionales del proyecto a partir de la especificación vigente.

Incluye:

- objetivo de cada iteración;
- cambios de implementación previstos;
- cambios de documentación OpenAPI;
- cambios de tests;
- resultado esperado al cerrar cada fase.

## Estado actual

La API se encuentra en una fase avanzada:

- `sports` ya está implementado como recurso CRUD.
- `weather-records` ya permite consulta con filtros, paginación y ordenación.
- `GET /installations/{id}/weather` ya resuelve meteorología bajo demanda y persiste histórico.
- el importador OSM ya carga instalaciones y catálogo de deportes, enlazando `installations.sports` con `sportId + name` cuando existe deporte de catálogo.
- el importador OSM ya limpia instalaciones obsoletas del municipio importado y sus registros meteorológicos asociados.
- la documentación OpenAPI ya recoge los recursos públicos principales.

Por tanto, las siguientes iteraciones deben centrarse en cerrar huecos concretos y revisar coherencia global, no en reconstruir recursos desde cero.

## Iteración 1. Completar `sports` como recurso real

### Objetivo

Dejar `sports` como un recurso completo y utilizable dentro de la API pública.

### Endpoints a implementar o completar

- `GET /sports`
- `POST /sports`
- `GET /sports/{id}`
- `PUT /sports/{id}`
- `PATCH /sports/{id}`
- `DELETE /sports/{id}`

### Filtros y comportamiento adicional

- `GET /sports` deberá aceptar `?missingMetadata=true`
- `missingMetadata=true` devolverá deportes con:
  - `category = null`
  - o `environment = null`

### Cambios de implementación

- crear validador específico de `sports`
- crear repositorio de `sports`
- crear controlador de `sports`
- ampliar rutas de `sports`
- implementar mensajes de error en español
- definir semántica de:
  - `PUT` como actualización completa
  - `PATCH` como actualización parcial

### Reglas funcionales mínimas

- `name` obligatorio
- `osmKey` según el contrato funcional que se cierre en implementación
- `category` opcional
- `environment` opcional
- `createdAt` y `updatedAt` automáticos

### Cambios en OpenAPI

Añadir y documentar:

- esquema `Sport`
- esquema `SportInput`
- esquema `SportPatchInput`
- respuestas de error
- respuesta de borrado
- filtro `missingMetadata=true`

### Tests a implementar

- unit tests del validador de `sports`
- unit tests del controlador de `sports`
- unit tests del repositorio de `sports`
- tests de integración del CRUD completo
- tests de integración del filtro `missingMetadata=true`

### Resultado esperado

- `sports` deja de ser un endpoint placeholder
- el recurso queda completamente alineado con la especificación

### Estado

Completada.

---

## Iteración 2. Potenciar `weather-records`

### Objetivo

Convertir `weather-records` en un recurso real de consulta de histórico meteorológico.

### Endpoints a implementar o completar

- `GET /weather-records`
- `GET /weather-records/{id}`

### Filtros requeridos

- `installationId`
- `dateFrom`
- `dateTo`
- `condition`

### Capacidades adicionales

- paginación con:
  - `page`
  - `limit`
- ordenación con:
  - `sortBy`
  - `sortOrder`

### Cambios de implementación

- crear validador específico de `weather-records`
- crear repositorio de `weather-records`
- crear controlador de `weather-records`
- ampliar rutas de `weather-records`
- validar:
  - `installationId` como `ObjectId`
  - fechas válidas
  - ordenación sobre campos permitidos

### Decisiones técnicas recomendadas

Permitir `sortBy` solo sobre campos documentados, por ejemplo:

- `queryDate`
- `temperature`
- `createdAt`

`dateFrom` y `dateTo` deberán aplicarse sobre `queryDate`.

### Cambios en OpenAPI

Añadir y documentar:

- esquema `WeatherRecord`
- esquema `WeatherRecordsListResponse`
- filtros
- paginación
- ordenación
- endpoint de detalle por id

### Tests a implementar

- unit tests del validador de `weather-records`
- unit tests del controlador de `weather-records`
- unit tests del repositorio de `weather-records`
- tests de integración de:
  - filtro por `installationId`
  - rango `dateFrom/dateTo`
  - filtro por `condition`
  - paginación
  - ordenación
  - detalle por id
  - errores `400`
  - errores `404`

### Resultado esperado

- `weather-records` pasa a ser un recurso útil de consulta
- la API puede explotar el histórico meteorológico de forma ordenada

### Estado

Completada.

---

## Iteración 3. Meteorología bajo demanda por instalación

### Objetivo

Implementar `GET /installations/{id}/weather` con caché temporal, consulta a OpenWeather y persistencia en `weather-records`.

### Endpoint afectado

- `GET /installations/{id}/weather`

### Decisiones funcionales cerradas

- si el `id` no es válido, responde `400`
- si la instalación no existe, responde `404`
- si la instalación no tiene coordenadas válidas, responde `400`
- si no hay weather previo, consulta proveedor, crea registro y responde `200`
- si hay weather previo vigente, reutiliza ese registro y responde `200`
- si el registro previo está caducado, consulta proveedor, crea un nuevo documento y responde `200`
- la vigencia se calcula sobre `queryDate`
- el registro de referencia es siempre el más reciente ordenado por `queryDate desc`
- el TTL por defecto es `60 minutos`
- el TTL será configurable mediante `WEATHER_CACHE_TTL_MINUTES`
- el proveedor acordado es `OpenWeather Current Weather API`
- la integración usará:
  - `OPENWEATHER_API_KEY`
  - `OPENWEATHER_BASE_URL`
  - `WEATHER_CACHE_TTL_MINUTES`
- la consulta al proveedor se hará por coordenadas de la instalación
- se usarán `units=metric` y `lang=es`
- `queryDate` será la hora actual del servidor
- `temperature` y `condition` son obligatorios
- `humidity` y `windspeed` se persistirán como `null` cuando falten
- si falta configuración interna, el endpoint devolverá `500`
- si falla el proveedor externo o devuelve respuesta inválida, el endpoint devolverá `502`
- la respuesta exitosa tendrá el formato:
  - `{ "data": { ...weatherRecord } }`

### Cambios de implementación

- crear servicio de integración con OpenWeather
- crear lógica de vigencia/caducidad del weather
- añadir acceso al último `weather-record` por instalación
- ampliar `installations` con el handler `GET /installations/{id}/weather`
- persistir un nuevo documento cuando no exista registro o esté caducado
- validar coordenadas y configuración de entorno
- mantener mensajes de error en español

### Cambios en OpenAPI

- documentar `GET /installations/{id}/weather`
- documentar respuestas `200`, `400`, `404`, `500`, `502`
- reflejar que la respuesta contiene un `weather-record`
- documentar la relación con el `_id` interno de la instalación

### Tests a implementar

- unit tests del servicio de OpenWeather
- unit tests de vigencia/caducidad
- unit tests del controlador
- integración del flujo:
  - sin registro previo
  - con registro vigente
  - con registro caducado
  - instalación inexistente
  - id inválido
  - instalación sin coordenadas
  - fallo del proveedor externo
  - configuración incompleta

### Resultado esperado

- la API podrá resolver y persistir meteorología bajo demanda por instalación
- `weather-records` pasará a ser además el histórico real generado por la integración externa

### Estado

Completada.

---

## Iteración 4. Búsqueda textual avanzada en `installations`

### Objetivo

Ampliar la capacidad de búsqueda de instalaciones con un parámetro libre `q`.

### Endpoint afectado

- `GET /installations`

### Nuevo parámetro

- `q`

### Campos sobre los que buscará `q`

- `name`
- `type`
- `city`

### Compatibilidad con filtros existentes

`q` deberá convivir con:

- `name`
- `city`
- `type`
- `sport`
- `page`
- `limit`

### Cambios de implementación

- ampliar validador de `installations`
- ampliar lógica del controlador de `GET /installations`
- construir consultas Mongo con búsqueda textual por varios campos
- revisar cómo combinar:
  - búsqueda libre `q`
  - filtros directos ya existentes

### Decisión de alcance

En esta iteración no se incluirá búsqueda sobre `weather`.

Motivo:

- `weather` no es un campo de `installations`
- pertenece al histórico en `weather-records`
- mezclar ambas colecciones en esta fase añade complejidad innecesaria

### Cambios en OpenAPI

Documentar:

- query param `q`
- campos sobre los que busca
- compatibilidad con el resto de filtros

### Tests a implementar

- unit tests del validador de `installations`
- unit tests del controlador de `installations`
- tests de integración de:
  - `q` por nombre
  - `q` por tipo
  - `q` por ciudad
  - `q + city`
  - `q` vacío inválido

### Resultado esperado

- las búsquedas de instalaciones serán más naturales para el usuario
- el endpoint de listado ganará expresividad sin romper el contrato actual

### Estado

Pendiente de revisar e implementar si todavía no está cerrado en código.

---

## Iteración 5. Cierre transversal y alineación global

### Objetivo

Revisar la coherencia global del proyecto después de las iteraciones funcionales.

### Áreas a revisar

- consistencia de respuestas en español
- consistencia de ids
- consistencia de paginación
- consistencia de ordenación
- consistencia entre implementación, tests y OpenAPI
- revisión del importador OSM respecto al modelo final

### Revisión del importador

Ya se ha avanzado en:

- creación y enlace de `sports`;
- persistencia de `sportId + name` en `installations.sports`.

Queda por revisar especialmente:

- alineación con la política de recarga por municipio

### Mejoras técnicas recomendadas

Revisar y, si procede, definir índices MongoDB sobre:

- `installations.name`
- `installations.city`
- `installations.type`
- `sports.name`
- `sports.osmKey`
- `weather-records.installationId`
- `weather-records.queryDate`

### Cambios en OpenAPI

- limpieza final de documentación
- eliminación de mensajes o referencias obsoletas
- revisión de ejemplos reales
- alineación completa con la especificación

### Tests a implementar o reforzar

- regresión cruzada de recursos
- pruebas de compatibilidad entre filtros
- revisión de cobertura sobre rutas principales

### Resultado esperado

- API coherente en todos sus recursos
- base estable para continuar con nuevas funcionalidades

### Estado

En curso. El importador OSM ya se ha alineado parcialmente con el modelo final.

---

## Orden recomendado de ejecución

1. Iteración 4: búsqueda avanzada en `installations`
2. Iteración 5: cierre transversal

## Motivo de este orden actual

- `sports`, `weather-records` y meteorología bajo demanda ya están operativos.
- la recarga de datos ya tiene limpieza de instalaciones obsoletas y weather huérfano.
- la búsqueda avanzada mejora directamente la experiencia del cliente.
- el cierre transversal debe hacerse cuando estén estables los recursos principales.

## Iteración 6. Recarga de datos y mantenimiento

### Objetivo

Cerrar el flujo de mantenimiento de datos cuando se vacía o recarga la base de datos.

### Alcance

- documentar claramente cómo vaciar `installations`, `sports` y `weather-records`;
- eliminar instalaciones OSM antiguas del municipio que ya no aparezcan en la nueva carga;
- eliminar registros meteorológicos asociados a instalaciones eliminadas;
- documentar el flujo recomendado para entorno local y de pruebas.

### Tests implementados o reforzados

- tests del importador cuando ya existen instalaciones del mismo municipio;
- tests de creación del catálogo `sports` durante importación;
- tests de enlace `sportId + name`;
- tests de limpieza de instalaciones obsoletas y registros meteorológicos asociados.

### Resultado esperado

- recarga de datos repetible y documentada;
- menor riesgo de duplicados o referencias huérfanas;
- flujo claro para vaciar y volver a importar datos.

### Estado

Completada.

## Criterio de cierre por iteración

Cada iteración se considerará cerrada únicamente cuando estén completos:

- código
- tests
- documentación `docs/openapi.yaml`

Además, cada iteración deberá mantener el proyecto en estado ejecutable y con la suite de tests en verde.
