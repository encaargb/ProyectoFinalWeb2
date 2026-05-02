# ProyectoFinalWeb2

## Integrantes del grupo:
- _Inés Del Río García_
- _Encarnación Teresa González Buitrago_
- _Jesús Joana Azuara_
- _Lucía Sorní Scaletti_

## Temática
El proyecto consiste en el desarrollo de una plataforma orientada a **descubrir y consultar instalaciones deportivas en España**, con el objetivo de facilitar a los usuarios encontrar lugares donde practicar distintos deportes según el tipo de instalación, el deporte disponible o su localización geográfica. La aplicación utiliza un conjunto amplio de **datos abiertos procedentes de OpenStreetMap**, que incluye miles de instalaciones deportivas como centros deportivos, estadios, pistas o parques con equipamiento para practicar deporte. Cada instalación contiene información como el nombre, el tipo de lugar, los deportes que se pueden practicar y sus coordenadas geográficas, lo que permite a los usuarios explorar y localizar fácilmente diferentes espacios deportivos en distintas ciudades del país.

Además, el sistema se complementa con **información externa que enriquece los datos de las instalaciones**, como las **condiciones meteorológicas de la zona**, permitiendo a los usuarios conocer el clima antes de realizar una actividad deportiva. De esta forma, la plataforma no solo ayuda a descubrir instalaciones deportivas cercanas, sino también a **planificar mejor cuándo y dónde practicar deporte**, facilitando el acceso a espacios deportivos y fomentando la actividad física en diferentes regiones de España.

## Tecnologías que vamos a utilizar
- Node.js
- Express
- MongoDB
- OpenAPI
- Jest
- Supertest

## Arquitectura
El proyecto queda separado en dos repositorios:

- API REST: este repositorio, responsable de exponer datos JSON.
- Cliente Web: `ProyectoFinalWeb2-Cliente`, responsable de servir HTML, CSS y JavaScript del navegador.

## Situación actual del backend

La API ya expone los recursos principales del proyecto:

- gestión de instalaciones mediante `/installations`;
- gestión del catálogo global de deportes mediante `/sports`;
- consulta del histórico meteorológico mediante `/weather-records`;
- consulta meteorológica bajo demanda con `/installations/{id}/weather`;
- documentación OpenAPI disponible en `/api-docs`.

El importador OSM carga instalaciones deportivas y, además, crea o actualiza el catálogo `sports` a partir de la información disponible en OSM. Cuando puede enlazar una instalación con un deporte del catálogo, guarda la referencia como `sportId + name` dentro de `installations.sports`.

Las siguientes iteraciones previstas se centran en cerrar detalles transversales: búsqueda textual avanzada en instalaciones, revisión de índices, limpieza final de OpenAPI, revisión de mensajes y validación de recarga de datos.

## Ejecución de la API
```bash
npm install
npm run dev
```

URL local:

```text
http://localhost:3000
```

Endpoints principales:

- `/installations`
- `/sports`
- `/weather-records`

## Importación de datos desde OSM
La carga de datos de OpenStreetMap se hace con un script separado de la aplicación.

El importador carga:

- instalaciones deportivas en `installations`;
- deportes detectados en el tag OSM `sport` dentro del catálogo `sports`;
- referencias `sportId` en los deportes asociados a cada instalación cuando el catálogo queda enlazado.

Ejemplo con `npm`:
```bash
npm run import:osm -- --municipality=Getafe --db=sports_facilities_test
```

Para vaciar y recargar una base de datos desde cero se recomienda borrar primero las colecciones implicadas desde `mongosh` y lanzar de nuevo el importador:

```javascript
db.installations.deleteMany({})
db.sports.deleteMany({})
db["weather-records"].deleteMany({})
```

Después:

```bash
npm run import:osm -- --municipality=Getafe
```
