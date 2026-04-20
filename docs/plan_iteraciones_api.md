# Plan de Iteraciones de la API

Este documento organiza las siguientes iteraciones funcionales del proyecto a partir de la especificación vigente.

Incluye:

- objetivo de cada iteración;
- cambios de implementación previstos;
- cambios de documentación OpenAPI;
- cambios de tests;
- resultado esperado al cerrar cada fase.

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

---

## Iteración 3. Búsqueda textual avanzada en `installations`

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

---

## Iteración 4. Cierre transversal y alineación global

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

Se revisará especialmente:

- creación y enlace de `sports`
- persistencia de `sportId + name` en `installations.sports`
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

---

## Orden recomendado de ejecución

1. Iteración 1: `sports`
2. Iteración 2: `weather-records`
3. Iteración 3: búsqueda avanzada en `installations`
4. Iteración 4: cierre transversal

## Motivo de este orden

- `sports` completa primero un recurso base del dominio
- `weather-records` completa el histórico meteorológico como recurso de consulta
- `installations` se amplía después con búsqueda avanzada sin mezclar todavía meteorología
- el cierre transversal evita rehacer documentación y tests varias veces

## Criterio de cierre por iteración

Cada iteración se considerará cerrada únicamente cuando estén completos:

- código
- tests
- documentación `docs/openapi.yaml`

Además, cada iteración deberá mantener el proyecto en estado ejecutable y con la suite de tests en verde.
