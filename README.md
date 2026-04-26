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
La carga de instalaciones deportivas se hace con un script separado de la aplicación.

Ejemplo con `npm`:
```bash
npm run import:osm -- --municipality=Getafe --db=sports_facilities_test
```
