# Especificación del Cliente

## 1. Propósito

Este documento define la propuesta funcional para un cliente capaz de consumir la API REST `sports-facilities-api`.

El objetivo del cliente es ofrecer una interfaz sencilla para consultar instalaciones deportivas, revisar deportes normalizados del sistema y visualizar información meteorológica asociada a instalaciones concretas.

## 2. Objetivo del cliente

El cliente deberá permitir:

- consultar instalaciones deportivas disponibles;
- acceder al detalle de una instalación;
- consultar la meteorología actual de una instalación concreta;
- consultar el histórico meteorológico persistido;
- consultar y gestionar deportes del sistema.

## 3. Alcance inicial

El cliente cubrirá exclusivamente la API pública ya aprobada en el proyecto.

Incluye:

- consumo de `GET /`;
- consumo de `installations`;
- consumo de `sports`;
- consumo de `weather-records`;
- consumo de `GET /installations/{id}/weather`.

No incluye en esta fase:

- importaciones manuales desde el cliente;
- autenticación de usuarios;
- panel de administración avanzado;
- sincronizaciones automáticas;
- mapas interactivos como requisito obligatorio.

## 4. Tipo de cliente propuesto

Se propone desarrollar un cliente web que funcione como aplicación de consumo de API.

Razones:

- encaja con la temática de la asignatura;
- permite demostrar consumo HTTP real de la API REST;
- facilita probar filtros, formularios, listados y detalle de recursos;
- es la forma más directa de reutilizar OpenAPI como contrato.

## 5. Funcionalidades mínimas

### 5.1. Pantalla de inicio

La aplicación mostrará:

- nombre del proyecto;
- breve explicación del sistema;
- acceso a las secciones principales;
- estado básico de la API usando `GET /`.

### 5.2. Listado de instalaciones

La sección de instalaciones permitirá:

- listar instalaciones;
- paginar resultados con `page` y `limit`;
- filtrar por `name`, `city`, `type` y `sport`;
- mostrar datos básicos de cada instalación:
  - nombre;
  - tipo;
  - ciudad;
  - deportes asociados.

### 5.3. Detalle de instalación

Desde una instalación concreta se mostrará:

- nombre;
- tipo;
- ciudad;
- deportes asociados;
- coordenadas si existen;
- fuente del dato;
- fecha de actualización si existe.

Además, desde esta vista se podrá lanzar la consulta meteorológica bajo demanda mediante `GET /installations/{id}/weather`.

### 5.4. Consulta meteorológica por instalación

El cliente deberá permitir:

- solicitar la meteorología actual de una instalación;
- mostrar el resultado devuelto por la API;
- informar si el dato procede de caché o de una nueva resolución no es obligatorio en esta fase;
- presentar al menos:
  - temperatura;
  - condición;
  - humedad;
  - velocidad del viento;
  - fecha de consulta.

### 5.5. Histórico meteorológico

La sección de `weather-records` permitirá:

- listar registros meteorológicos;
- filtrar por `installationId`;
- filtrar por `condition`;
- filtrar por rango con `dateFrom` y `dateTo`;
- paginar con `page` y `limit`;
- ordenar con `sortBy` y `sortOrder`;
- abrir el detalle de un registro por su id si se desea.

### 5.6. Gestión de deportes

La sección de `sports` permitirá:

- listar deportes;
- filtrar deportes incompletos con `missingMetadata=true`;
- crear nuevos deportes;
- consultar un deporte concreto;
- actualizar deportes con `PUT`;
- actualizar parcialmente con `PATCH`;
- eliminar deportes.

Como mínimo, en cada deporte se mostrará:

- nombre;
- `osmKey`;
- categoría;
- entorno.

## 6. Operaciones del cliente sobre la API

El cliente deberá estar preparado para consumir estos endpoints:

- `GET /`
- `GET /installations`
- `GET /installations/{id}`
- `GET /installations/{id}/weather`
- `POST /installations`
- `PUT /installations/{id}`
- `DELETE /installations/{id}`
- `GET /sports`
- `GET /sports/{id}`
- `POST /sports`
- `PUT /sports/{id}`
- `PATCH /sports/{id}`
- `DELETE /sports/{id}`
- `GET /weather-records`
- `GET /weather-records/{id}`

## 7. Estructura funcional recomendada

Se recomienda dividir el cliente en las siguientes secciones:

- `Inicio`
- `Instalaciones`
- `Detalle de instalación`
- `Meteorología`
- `Deportes`
- `Histórico meteorológico`

## 8. Requisitos de experiencia de usuario

El cliente deberá:

- mostrar mensajes de carga durante las peticiones;
- mostrar mensajes de error legibles en español;
- reflejar respuestas vacías sin romper la interfaz;
- permitir navegar entre listados y detalles de forma clara;
- mantener formularios sencillos y consistentes.

## 9. Gestión de errores

El cliente deberá contemplar al menos:

- error `400` por filtros o ids inválidos;
- error `404` cuando el recurso no exista;
- error `500` por fallo interno de configuración;
- error `502` cuando falle la integración meteorológica externa.

La interfaz debe presentar el `message` recibido por la API de forma comprensible para el usuario.

## 10. Requisitos técnicos recomendados

La implementación del cliente puede realizarse con la tecnología frontend que el equipo decida, pero se recomienda:

- separación entre capa de vista y capa de acceso HTTP;
- módulo o servicio único para llamadas a la API;
- uso de variables de entorno para la URL base del backend;
- componentes reutilizables para:
  - tablas;
  - formularios;
  - mensajes de error;
  - paginación.

## 11. Resultado esperado

Al cerrar esta fase, el cliente deberá permitir demostrar de forma visible y navegable que:

- la API puede consultarse desde una interfaz real;
- las instalaciones pueden explorarse;
- la meteorología por instalación funciona;
- el histórico meteorológico puede filtrarse;
- los deportes pueden gestionarse desde el cliente.

## 12. Evolución posterior

En fases posteriores, el cliente podrá ampliarse con:

- búsqueda avanzada `q` en instalaciones cuando se cierre la Iteración 4;
- visualización cartográfica;
- mejoras de diseño y experiencia de usuario;
- panel de revisión de deportes incompletos;
- exportaciones o vistas estadísticas.
