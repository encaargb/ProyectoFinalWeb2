# Plan de Iteraciones del Cliente

Este documento organiza la implementación del cliente web que consumirá `sports-facilities-api`.

El objetivo del plan es dividir el trabajo en entregas pequeñas, coherentes y fáciles de subir al repositorio de forma progresiva, asegurando que cada iteración deje una parte funcional y demostrable del cliente.

Además, el cliente deberá desarrollarse como una entrega separada del backend.

Esto implica que:

- el código del cliente no debe mezclarse con la implementación interna de la API REST;
- el cliente debe mantenerse en su propio proyecto, carpeta o repositorio independiente según decida el equipo;
- sus pruebas, dependencias, configuración y documentación deben pertenecer al cliente y no al backend;
- el cierre de iteraciones del cliente debe evaluarse sobre su propio código y su propia suite de tests.

## Criterios de división

Las iteraciones se han dividido siguiendo estos principios:

- cada iteración debe aportar una funcionalidad visible;
- cada iteración debe ser integrable sin dejar el cliente roto;
- primero se construye la base común del frontend;
- después se implementan los flujos de consulta más importantes;
- las operaciones de edición y gestión se dejan para una fase posterior;
- la meteorología y el histórico se separan para mantener commits y entregas más claros.
- cada iteración debe incluir también sus pruebas antes de considerarse cerrada.

## Iteración 1. Base del cliente y conexión con la API

### Objetivo

Crear la estructura inicial del cliente y verificar que puede comunicarse correctamente con la API.

### Alcance

- crear el proyecto frontend;
- crear el cliente en una ubicación separada de la API REST;
- definir estructura básica de carpetas;
- configurar la URL base de la API;
- crear un servicio común de acceso HTTP;
- crear la navegación principal;
- implementar una pantalla de inicio;
- comprobar el estado de la API con `GET /`.

### Resultado esperado

Al cerrar esta iteración, el repositorio ya contendrá un cliente arrancable con:

- estructura base;
- layout principal;
- navegación mínima;
- pantalla de inicio funcional;
- primera llamada real a la API.

### Tests a implementar

- test del servicio HTTP o módulo de conexión con la API;
- test del componente o vista de inicio;
- test del flujo de carga correcta del estado de la API;
- test del estado de error si `GET /` falla.

### Motivo para subirla sola

Esta iteración deja una base limpia y reutilizable para todo lo demás. Es una buena primera subida porque demuestra que el cliente existe, arranca y se conecta al backend.

---

## Iteración 2. Listado y detalle de instalaciones

### Objetivo

Implementar el recurso más importante del dominio en modo consulta: instalaciones deportivas.

### Alcance

- crear vista de listado de instalaciones;
- consumir `GET /installations`;
- mostrar paginación con `page` y `limit`;
- permitir filtros por:
  - `name`
  - `city`
  - `type`
  - `sport`
- crear vista de detalle de instalación;
- consumir `GET /installations/{id}`;
- mostrar información principal de cada instalación.

### Resultado esperado

El usuario podrá:

- navegar por instalaciones;
- filtrar resultados;
- cambiar de página;
- abrir una instalación concreta y ver su detalle.

### Tests a implementar

- tests del servicio de instalaciones;
- tests de renderizado del listado;
- tests de filtros por `name`, `city`, `type` y `sport`;
- tests de paginación;
- test de navegación al detalle;
- test de la vista de detalle de instalación;
- test de estados de carga y error en listado y detalle.

### Motivo para subirla sola

Es la primera funcionalidad de negocio real del cliente. Permite enseñar una parte útil y completa sin depender todavía de formularios ni de meteorología.

---

## Iteración 3. Meteorología por instalación

### Objetivo

Añadir al cliente la capacidad de consultar la meteorología de una instalación concreta.

### Alcance

- añadir acción desde la vista de detalle de instalación;
- consumir `GET /installations/{id}/weather`;
- mostrar:
  - temperatura
  - condición
  - humedad
  - velocidad del viento
  - fecha de consulta
- gestionar estados de carga y error para este flujo;
- representar correctamente errores `400`, `404`, `500` y `502`.

### Resultado esperado

Desde una instalación concreta, el usuario podrá consultar el clima asociado y ver el resultado de la API de forma comprensible.

### Tests a implementar

- test del servicio de meteorología por instalación;
- test del disparo de la acción de consulta weather;
- test de renderizado correcto de temperatura, condición, humedad y viento;
- test de estado de carga;
- tests de errores `400`, `404`, `500` y `502`.

### Motivo para subirla sola

Aunque depende del detalle de instalación, es un bloque funcional independiente y muy representativo del proyecto. Subirlo aparte deja un avance claro y fácil de revisar.

---

## Iteración 4. Histórico meteorológico

### Objetivo

Implementar la consulta del histórico meteorológico como una sección propia del cliente.

### Alcance

- crear vista de histórico meteorológico;
- consumir `GET /weather-records`;
- mostrar listado de registros;
- implementar filtros por:
  - `installationId`
  - `condition`
  - `dateFrom`
  - `dateTo`
- implementar ordenación con:
  - `sortBy`
  - `sortOrder`
- implementar paginación;
- permitir abrir detalle con `GET /weather-records/{id}` si se considera útil.

### Resultado esperado

El cliente ya permitirá trabajar con el histórico meteorológico como recurso propio, no solo con el weather bajo demanda de una instalación.

### Tests a implementar

- tests del servicio de `weather-records`;
- test del listado del histórico;
- tests de filtros por `installationId`, `condition`, `dateFrom` y `dateTo`;
- tests de ordenación;
- tests de paginación;
- test del detalle de weather-record si se implementa;
- tests de carga vacía y error de consulta.

### Motivo para subirla sola

Es un módulo suficientemente grande y autónomo. Separarlo mejora la trazabilidad y evita mezclar en un mismo commit meteorología puntual e histórico.

---

## Iteración 5. Consulta y gestión de deportes

### Objetivo

Incorporar el recurso `sports` primero como consulta y después como gestión básica.

### Alcance

- crear vista de listado de deportes;
- consumir `GET /sports`;
- implementar filtro `missingMetadata=true`;
- mostrar detalle de deporte con `GET /sports/{id}`;
- crear formularios para:
  - `POST /sports`
  - `PUT /sports/{id}`
  - `PATCH /sports/{id}`
- permitir eliminar con `DELETE /sports/{id}`;
- mostrar mensajes de éxito y error en español.

### Resultado esperado

El cliente podrá gestionar el recurso `sports` de extremo a extremo.

### Tests a implementar

- tests del servicio de deportes;
- tests del listado y filtro `missingMetadata=true`;
- tests del detalle de deporte;
- tests de formulario de alta;
- tests de edición completa con `PUT`;
- tests de edición parcial con `PATCH`;
- test de borrado;
- tests de mensajes de éxito y error.

### Motivo para subirla sola

Aquí ya aparece lógica de formularios y mutaciones sobre la API. Es mejor subirlo separado de los módulos de solo consulta.

---

## Iteración 6. Gestión básica de instalaciones

### Objetivo

Completar la parte de instalaciones añadiendo operaciones de creación, edición y borrado.

### Alcance

- crear formulario de alta de instalación con `POST /installations`;
- crear formulario de edición con `PUT /installations/{id}`;
- añadir borrado con `DELETE /installations/{id}`;
- validar campos básicos en cliente;
- refrescar listados tras operaciones exitosas;
- mostrar errores devueltos por la API.

### Resultado esperado

El cliente permitirá no solo consultar instalaciones, sino también gestionarlas desde la interfaz.

### Tests a implementar

- tests del formulario de alta;
- tests del formulario de edición;
- test de borrado;
- tests de validaciones básicas en cliente;
- tests de refresco de listado tras crear, editar o eliminar;
- tests de error cuando la API rechaza la operación.

### Motivo para subirla sola

Separar la consulta de la edición mantiene el proyecto más ordenado y reduce el riesgo de romper las vistas principales que ya funcionaban.

---

## Iteración 7. Mejora de experiencia de usuario y cierre

### Objetivo

Revisar el cliente de forma transversal para dejarlo consistente, usable y preparado para entrega.

### Alcance

- homogeneizar mensajes de carga, error y éxito;
- revisar navegación entre secciones;
- mejorar tablas, formularios y paginación;
- revisar nombres, títulos y textos visibles;
- limpiar código duplicado;
- revisar configuración de la URL base;
- añadir una capa mínima de reutilización de componentes si aún falta.

### Resultado esperado

El cliente quedará estable, coherente y preparado para seguir evolucionando.

### Tests a implementar

- revisión y ajuste de la suite existente;
- tests de regresión de navegación principal;
- tests de componentes compartidos críticos;
- tests de flujos completos más importantes del cliente.

### Motivo para subirla sola

Esta iteración sirve como cierre de calidad. Permite hacer una última subida centrada en pulido y coherencia sin mezclarla con nuevas funcionalidades.

---

## Orden recomendado de ejecución

1. Iteración 1: base del cliente y conexión con la API
2. Iteración 2: listado y detalle de instalaciones
3. Iteración 3: meteorología por instalación
4. Iteración 4: histórico meteorológico
5. Iteración 5: consulta y gestión de deportes
6. Iteración 6: gestión básica de instalaciones
7. Iteración 7: mejora de experiencia de usuario y cierre

## Motivo de este orden

- primero se valida la base técnica del cliente;
- después se construye el flujo principal de consulta;
- luego se aprovecha ese flujo para añadir meteorología;
- más tarde se incorpora el histórico como módulo independiente;
- después se añaden operaciones CRUD de deportes;
- la edición de instalaciones se deja cuando la consulta ya está estable;
- el cierre final evita rehacer partes visuales varias veces.

## Criterio de cierre por iteración

Cada iteración del cliente se considerará cerrada cuando incluya:

- código funcional integrado;
- código separado del backend y mantenido como entrega independiente;
- navegación o acceso visible a la nueva funcionalidad;
- control básico de carga y errores;
- tests del bloque implementado;
- comprobación manual del flujo principal;
- estado estable para poder subirlo al repositorio sin romper lo anterior.
