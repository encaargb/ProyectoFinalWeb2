# Informe de revision de requisitos de la API REST

**Proyecto:** ProyectoFinalWeb2  
**Autores del documento:** Equipo del proyecto: Ines Del Rio Garcia, Encarnacion Teresa Gonzalez Buitrago, Jesus Joana Azuara y Lucia Sorni Scaletti.  
**Responsable de la revision:** Jesus Joana Azuara  
**Fecha de revision:** 18/05/2026  
**Version revisada:** version final tras iteraciones de cierre  
**Commit base revisado:** `1497af8023f637dbe001fbf0f233eca994ea24bc`  
**Commit base corto:** `1497af8`  
**Mensaje del commit base:** `Documentación API REST completada para la entrega final`  
**Fecha del commit base:** `2026-05-17T19:08:57+02:00`

## 1. Objetivo del informe

Este documento recoge la revision que he realizado sobre la version actual del software entregado, con el objetivo de comprobar que la API REST cumple los requisitos basicos indicados para el proyecto.

La revision se ha hecho sobre el repositorio `ProyectoFinalWeb2`, revisando el codigo fuente, la documentacion, los scripts de carga, los datasets incluidos y la suite de tests.

## 2. Resumen ejecutivo

La API REST esta implementada en Node.js con Express, utiliza MongoDB como base de datos y expone recursos REST para instalaciones deportivas, deportes y registros meteorologicos.

La version revisada cumple los requisitos estructurales del proyecto: tecnologia Node.js, uso de MongoDB, existencia de tres recursos relacionados, persistencia en colecciones separadas, consumo externo JSON y XML, mensajes REST JSON y XML con schema asociado, carga de datos mediante script npm y dataset incluido en el repositorio.

Tras la iteracion de consumo XML externo y la nueva importacion de instalaciones, no quedan puntos obligatorios pendientes detectados en esta revision.

El requisito de CRUD sobre la base de datos se considera cumplido, ya que la API ofrece operaciones CRUD publicas sobre la base de datos a traves de los recursos `installations` y `sports`. El recurso `weather-records` funciona como historico meteorologico generado por la propia API y consultable desde endpoints publicos.

## 3. Version revisada del software

La revision parte del ultimo commit entregado:

```text
1497af8023f637dbe001fbf0f233eca994ea24bc
```

Tras ese commit se han incorporado las iteraciones de cierre documentadas en este informe: consumo XML externo mediante OpenWeather y ampliacion/exportacion del dataset hasta superar los 1000 documentos en `installations`.

## 4. Revision requisito por requisito

| Requisito | Estado | Observaciones |
|---|---|---|
| El proyecto se realiza en grupos de 4 a 6 personas. | Cumple | En el README aparecen cuatro integrantes: Ines Del Rio Garcia, Encarnacion Teresa Gonzalez Buitrago, Jesus Joana Azuara y Lucia Sorni Scaletti. |
| La tematica es libre, excepto series y peliculas, y debe estar validada por el profesor. | Parcial / no verificable | La tematica es instalaciones deportivas, por lo que no incumple la restriccion de series y peliculas. No se puede verificar desde el repositorio si fue validada formalmente por el profesor. |
| La API tiene que estar programada en Node.js. | Cumple | El proyecto usa Node.js, Express y dependencias npm. |
| La API tiene que consumir informacion de al menos una API externa. | Cumple | Se consume OpenWeather para meteorologia y OpenStreetMap/Overpass para carga de instalaciones. |
| Al menos un mensaje consumido desde API externa tiene que estar en formato XML. | Cumple | OpenWeather se consulta con `mode=xml`, la respuesta externa se lee como texto XML, se parsea en Node.js y se transforma al modelo interno de `weather-records`. |
| Al menos un mensaje consumido desde API externa tiene que estar en formato JSON. | Cumple | Overpass se consume como JSON en el importador OSM mediante `response.json()`. |
| La informacion consumida tiene que integrarse con el resto de la API y guardarse en base de datos. | Cumple | Los datos de OpenStreetMap se guardan como instalaciones y deportes. Los datos de OpenWeather se guardan como registros meteorologicos asociados a instalaciones. |
| La API tiene que seguir funcionando aunque la API externa este caida. | Cumple | Si OpenWeather falla, el endpoint meteorologico devuelve un error controlado y el resto de endpoints sigue funcionando. En la carga OSM se usan instancias fallback de Overpass; si todas fallan, solo queda afectado el proceso de importacion. |
| La API tiene que ofrecer una interfaz REST con operaciones CRUD sobre la base de datos. | Cumple | La API ofrece CRUD completo sobre la base de datos mediante `installations` y `sports`. El requisito se interpreta sobre la base de datos en su conjunto, no necesariamente como CRUD completo en cada una de las tres colecciones. |
| Al menos un mensaje REST tiene que estar en formato XML y tener schema asociado. | Cumple | `GET /installations/{id}` puede devolver XML con `Accept: application/xml`. El schema esta en `docs/schemas/installation.xsd`. |
| Al menos un mensaje REST tiene que estar en formato JSON. | Cumple | JSON es el formato principal de la API. Los cuerpos de POST/PUT se procesan con `express.json()`. |
| Tiene que haber al menos tres recursos y estar relacionados entre ellos. | Cumple | Existen `installations`, `sports` y `weather-records`. Las instalaciones enlazan deportes mediante `sportId` y los registros meteorologicos enlazan instalaciones mediante `installationId`. |
| Los datos de cada recurso tienen que guardarse en una coleccion. | Cumple | Existen colecciones MongoDB para `installations`, `sports` y `weather-records`. |
| La base de datos tiene que ser MongoDB. | Cumple | El proyecto usa el driver oficial de MongoDB y colecciones MongoDB. |
| Los datos se tienen que poder cargar automaticamente desde un script npm. | Cumple | Existe el script `npm run import:osm`, que carga datos desde OpenStreetMap/Overpass. |
| Una de las colecciones tiene que contener al menos 1000 documentos. | Cumple | El dataset incluido contiene 1583 instalaciones, 43 deportes y 4 registros meteorologicos. `installations` es la coleccion grande. |
| Generar un JSON para importar estos datos. | Cumple | El repositorio incluye `data/installations.json`, `data/sports.json` y `data/weather-records.json`. |
| Al menos una ruta tiene que ofrecer paginacion para realizar busquedas en la coleccion grande. | Cumple | `GET /installations` tiene paginacion con `page` y `limit`, y `installations` contiene 1583 documentos. |
| Al menos una ruta tiene que permitir filtrar datos para realizar busquedas en la coleccion grande. | Cumple | `GET /installations` permite filtrar por `name`, `city`, `type` y `sport`, y `installations` contiene 1583 documentos. |
| Tiene que haber un dataset en el repositorio para inicializar las colecciones. | Cumple | El dataset esta en la carpeta `data/`. |

## 5. Evidencias tecnicas revisadas

### 5.1. API en Node.js y Express

El proyecto define una API Express. En `src/app.js` se configuran los routers principales:

```text
app.use('/installations', installationsRoutes);
app.use('/sports', sportsRoutes);
app.use('/weather-records', weatherRoutes);
```

Tambien se usa:

```text
app.use(express.json());
```

Esto confirma que el formato de entrada principal para cuerpos de peticion es JSON.

### 5.2. Recursos REST disponibles

La API expone los siguientes recursos principales:

- `installations`
- `sports`
- `weather-records`

El recurso `installations` tiene:

- `GET /installations`
- `POST /installations`
- `GET /installations/{id}`
- `PUT /installations/{id}`
- `DELETE /installations/{id}`
- `GET /installations/{id}/weather`

El recurso `sports` tiene:

- `GET /sports`
- `POST /sports`
- `GET /sports/{id}`
- `PUT /sports/{id}`
- `PATCH /sports/{id}`
- `DELETE /sports/{id}`

El recurso `weather-records` tiene:

- `GET /weather-records`
- `GET /weather-records/{id}`

Por tanto, hay CRUD completo sobre la base de datos mediante `installations` y `sports`. El recurso `weather-records` se mantiene como historico generado por la propia API al consultar la meteorologia de una instalacion y se expone para consulta publica.

### 5.3. Mensajes JSON

JSON es el formato principal de intercambio. Los endpoints de creacion y actualizacion reciben cuerpos JSON y los listados/detalles devuelven JSON por defecto.

Ejemplo de mensaje JSON de entrada para crear una instalacion:

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

### 5.4. Mensaje XML ofrecido por la API

El endpoint:

```http
GET /installations/{id}
Accept: application/xml
```

devuelve una instalacion en XML. Ejemplo:

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

El schema asociado esta en:

```text
docs/schemas/installation.xsd
```

Este requisito se cumple para la interfaz REST, pero no debe confundirse con el requisito de consumir XML desde una API externa.

### 5.5. Consumo de APIs externas

La version actual consume dos fuentes externas:

1. **OpenWeather**
   - Se consulta desde `src/services/openweather.service.js`.
   - La peticion incluye `mode=xml`.
   - La respuesta externa se procesa como XML mediante `response.text()` y parseo XML en Node.js.
   - Los datos se guardan en la coleccion `weather-records`.
   - Este flujo cierra el requisito de consumir un mensaje XML desde una API externa.

2. **OpenStreetMap/Overpass**
   - Se consulta desde `src/services/osm-import.service.js`.
   - La consulta Overpass usa `[out:json]`.
   - La respuesta se procesa como JSON con `response.json()`.
   - Los datos se guardan en `installations` y `sports`.
   - La documentacion oficial de Overpass tambien contempla OSM XML como formato de salida, aunque la version actual del script fuerza JSON.

Conclusion: se cumple el consumo JSON externo mediante Overpass y el consumo XML externo mediante OpenWeather.

### 5.6. Persistencia en MongoDB

Las colecciones principales utilizadas son:

- `installations`
- `sports`
- `weather-records`

Las relaciones principales son:

- `installations.sports[]` contiene referencias a deportes con `sportId` y `name`.
- `weather-records.installationId` referencia una instalacion.

### 5.7. Script de carga automatica

El proyecto incluye en `package.json`:

```json
"import:osm": "node scripts/import-osm.js"
```

Se ejecuta con:

```bash
npm run import:osm -- --municipality=Getafe
```

Este script consulta OpenStreetMap/Overpass, transforma los datos y actualiza MongoDB.

### 5.8. Dataset incluido

El repositorio incluye:

```text
data/installations.json
data/sports.json
data/weather-records.json
```

Conteo verificado en la version revisada:

```text
installations: 1583
sports: 43
weather-records: 4
```

Por tanto, existe dataset para inicializar colecciones y la coleccion `installations` cumple el requisito de contener al menos 1000 documentos.

### 5.9. Paginacion y filtros

`GET /installations` permite paginacion:

```http
GET /installations?page=1&limit=10
```

Tambien permite filtros:

```http
GET /installations?city=Getafe&sport=tennis&type=pitch
```

El requisito funcional de paginacion y filtrado queda cumplido sobre la coleccion grande `installations`, que contiene 1583 documentos.

## 6. Resultado de tests

La suite de tests se ejecuto sobre esta version del proyecto con resultado correcto:

```text
Test Suites: 17 passed, 17 total
Tests: 154 passed, 154 total
```

Esto indica que la version actual es estable respecto a los tests existentes. Ademas, se ha verificado el minimo de 1000 documentos mediante conteo directo de la coleccion `installations` y del dataset exportado.

## 7. Revision de requisitos opcionales

Los siguientes requisitos no forman parte del bloque obligatorio principal, pero se han revisado para dejar constancia del estado actual de la version entregada.

| Requisito opcional | Estado | Observaciones |
|---|---|---|
| Implementar al menos un Webhook. | No implementado | No se ha encontrado ningun endpoint, servicio o flujo identificado como webhook en la API ni en el cliente. |
| Anadir tests para validar las rutas. | Cumple | El backend incluye tests de rutas con Supertest para `GET /`, `installations`, `sports`, `weather-records`, XML de instalaciones, errores, filtros, paginacion e integraciones. |
| Hacer un cliente desacoplado que permita interactuar con todas las rutas de la API. | Cumple parcialmente | Existe un cliente independiente en `ProyectoFinalWeb2-Cliente`, arrancado por separado y desacoplado del backend. Permite interactuar con la mayoria de rutas funcionales de la API, pero no cubre estrictamente todas las rutas o variantes documentadas, como `GET /weather-records/{id}` o la variante XML de `GET /installations/{id}`. |

### 7.1. Webhook

No se ha encontrado implementacion de webhook en la version revisada.

No aparecen rutas ni servicios especificos con comportamiento de webhook, entendiendo webhook como un endpoint preparado para recibir notificaciones/eventos externos desde otro sistema o como un mecanismo de notificacion saliente hacia una URL configurada por terceros.

Por tanto, este requisito opcional queda como no implementado.

### 7.2. Tests de rutas

Este requisito opcional se considera cumplido.

El backend usa `supertest` y contiene pruebas unitarias e integracion que validan rutas principales:

- `GET /`
- `OPTIONS /installations`
- `GET /api-docs`
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

Tambien hay tests especificos para validacion de XML en instalaciones, filtros, paginacion, errores de identificadores invalidos, errores del proveedor externo y persistencia en base de datos.

Resultado de tests del backend:

```text
Test Suites: 17 passed, 17 total
Tests: 154 passed, 154 total
```

### 7.3. Cliente desacoplado

Existe un cliente independiente en el repositorio:

```text
ProyectoFinalWeb2-Cliente
```

El cliente se ejecuta como aplicacion separada mediante:

```bash
npm start
```

o:

```bash
npm run dev
```

Por defecto queda disponible en:

```text
http://localhost:5173
```

La URL base del backend esta centralizada en:

```text
public/js/config.js
```

Esto confirma que el cliente esta desacoplado del backend y consume la API por HTTP.

El cliente permite interactuar con:

- estado de la API;
- listado, filtrado, paginacion, creacion, edicion, detalle y borrado de instalaciones;
- consulta de meteorologia de una instalacion;
- listado, filtrado, paginacion, detalle, creacion, actualizacion parcial y borrado de deportes;
- listado, filtrado, ordenacion y paginacion de registros meteorologicos.

No obstante, si se interpreta literalmente "todas las rutas", el cliente no cubre de forma estricta todas las rutas o variantes de la API, ya que no se ha encontrado una vista o funcion especifica para:

- `GET /weather-records/{id}`;
- solicitar `GET /installations/{id}` con `Accept: application/xml`;
- navegar por `/api-docs`, aunque esta ruta pertenece a la documentacion Swagger y no al flujo funcional principal.

Por este motivo, el requisito opcional se marca como cumplido parcialmente.

Resultado de tests del cliente:

```text
tests: 35
pass: 35
fail: 0
```

## 8. Revision de documentacion y entrega final

Esta seccion revisa los requisitos documentales y las comprobaciones finales de entrega indicadas para el proyecto.

### 8.1. Documentacion exigida

| Requisito de documentacion | Estado | Observaciones |
|---|---|---|
| Documento de diseno de la interfaz REST incluyendo ejemplos de mensajes. | Cumple | Existe `docs/diseno_interfaz_rest.md` e incluye rutas, recursos, ejemplos HTTP, JSON y XML. |
| Archivo OpenAPI con la descripcion del servicio. | Cumple | Existe `docs/openapi.yaml`. Se ha validado que carga correctamente como OpenAPI `3.0.3` y contiene la descripcion del servicio. |
| Modelo de datos de la base de datos. | Cumple | Existe `docs/modelo_datos.md`, con colecciones, campos, reglas y relaciones entre `installations`, `sports` y `weather-records`. |
| README con informacion para hacer funcionar el proyecto, acceso a API externa y miembros del grupo. | Cumple | `README.md` incluye integrantes, requisitos previos, instalacion, configuracion `.env`, OpenWeather, MongoDB, carga de datos, ejecucion, endpoints, documentacion y tests. |
| Dataset y script para cargar los datos. | Cumple | Existen `data/installations.json`, `data/sports.json`, `data/weather-records.json` y el script npm `npm run import:osm`. |

### 8.2. Documentos localizados

La documentacion principal de la API se encuentra en:

```text
README.md
docs/diseno_interfaz_rest.md
docs/openapi.yaml
docs/modelo_datos.md
docs/script_cargaDatos.md
docs/schemas/installation.xsd
```

Ademas, el repositorio incluye:

```text
.env.example
data/installations.json
data/sports.json
data/weather-records.json
scripts/import-osm.js
```

### 8.3. Revision final de funcionamiento

| Requisito final | Estado | Observaciones |
|---|---|---|
| Revisar que se responde a lo que se pide. | Cumple | La API responde a los requisitos obligatorios revisados. El consumo XML externo esta implementado y `installations` supera los 1000 documentos. |
| Revisar que el codigo funciona y no hay errores obvios. | Cumple | Backend y cliente ejecutan sus tests correctamente. |
| El codigo debe funcionar out-of-the-box. | Cumple condicionado | El proyecto puede instalarse y ejecutarse siguiendo el README. Requiere Node.js, MongoDB, `.env` y API key de OpenWeather para la funcionalidad meteorologica completa. Estos requisitos estan documentados. |
| Revisar que el proyecto funciona sin archivos adicionales o que se indica si hace falta algo mas. | Cumple | Se incluye `.env.example` y el README indica las variables necesarias, MongoDB, API key externa y herramientas de importacion. |
| Anadir la documentacion necesaria para hacerlo funcionar. | Cumple | README, documentacion REST, OpenAPI, modelo de datos y script de carga cubren la puesta en marcha y uso principal. |

### 8.4. Comprobaciones realizadas

Se ha comprobado que el archivo OpenAPI carga correctamente:

```text
OpenAPI: 3.0.3
Titulo: Sports Facilities API
Paths documentados: 8
```

Tambien se ha corregido una inconsistencia menor en `docs/script_cargaDatos.md` para usar el mismo nombre de base de datos que el README y `.env.example`:

```text
proyectoFinalWeb
```

Como mejora de claridad, el README se ha actualizado para indicar que el repositorio incluye `.env.example` y que debe copiarse o usarse como plantilla para crear el `.env` real.

### 8.5. Valoracion documental

La documentacion cumple los requisitos aplicables. El proyecto queda documentado para instalar dependencias, configurar entorno, cargar datos, arrancar la API, consultar Swagger/OpenAPI, entender el modelo de datos y ejecutar tests.

El dataset incluido se ha actualizado tras la nueva importacion y deja `installations` como coleccion grande con 1583 documentos.

## 9. Puntos pendientes cerrados

### 9.1. Consumo XML desde API externa implementado

El enunciado exige:

```text
Al menos un mensaje que se consuma tiene que ser en formato XML.
```

La API ya consume XML desde una API externa. La integracion de OpenWeather solicita la respuesta del proveedor con `mode=xml`, lee el cuerpo con `response.text()`, parsea el XML en Node.js y lo transforma al modelo interno de `weather-records`.

El flujo queda integrado en:

- `GET /installations/{id}/weather`;
- `src/services/openweather.service.js`;
- coleccion MongoDB `weather-records`.

El cliente de la API sigue recibiendo JSON desde el endpoint REST, pero el mensaje consumido desde OpenWeather es XML, que es el requisito que estaba pendiente.

Se han anadido pruebas para verificar:

- construccion de URL con `mode=xml`;
- parseo de XML valido;
- rechazo de XML mal formado o incompleto;
- persistencia del resultado en `weather-records`.

### 9.2. Coleccion con al menos 1000 documentos completada

El enunciado exige:

```text
Una de las colecciones tiene que contener al menos 1000 documentos.
```

El dataset incluido ya alcanza esa cantidad:

```text
installations: 1583
sports: 43
weather-records: 4
```

La coleccion grande es `installations`. Se ha actualizado el dataset del repositorio con una nueva exportacion desde la base local `proyectoFinalWeb`.

Con esto, la paginacion y los filtros de `GET /installations` operan sobre una coleccion que supera el minimo exigido.

### 9.3. CRUD sobre la base de datos

Este requisito se considera cumplido. La API ofrece operaciones CRUD sobre la base de datos mediante los recursos `installations` y `sports`. El enunciado se interpreta como CRUD sobre la base de datos en su conjunto, no como obligacion de que los tres recursos tengan CRUD completo.

`weather-records` queda justificado como una coleccion de historico generada por la propia API cuando se consulta la meteorologia de una instalacion, y expuesta publicamente para consulta.

## 10. Recomendaciones para cerrar el cumplimiento

No quedan recomendaciones obligatorias pendientes para cerrar el cumplimiento del enunciado revisado.

Como mejora opcional, se puede seguir ampliando el cliente desacoplado para cubrir tambien rutas o variantes menos habituales, como `GET /weather-records/{id}` o la variante XML de `GET /installations/{id}`.

## 11. Conclusion

Como conclusion de la revision, considero que la version actual del software cumple los requisitos obligatorios esperados para el proyecto: API REST en Node.js, MongoDB, tres recursos relacionados, consumo externo JSON y XML, JSON como formato principal, XML REST con schema, scripts de carga y dataset incluido.

La coleccion `installations` contiene 1583 documentos, por lo que cubre el requisito de coleccion grande para paginacion y filtrado.

La practica queda cerrada respecto a los requisitos obligatorios revisados.
