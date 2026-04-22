const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const installationsRoutes = require('./routes/installations.routes');
const sportsRoutes = require('./routes/sports.routes');
const weatherRoutes = require('./routes/weather.routes');

// Cargamos la documentación OpenAPI para servirla en Swagger UI.
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'docs', 'openapi.yaml'));
const app = express();

// Este middleware permite leer cuerpos JSON en POST, PUT y PATCH.
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Sports Facilities API is running' });
});

// Swagger permite probar la API desde el navegador.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Cada recurso principal de la API cuelga de su propio router.
app.use('/installations', installationsRoutes);
app.use('/sports', sportsRoutes);
app.use('/weather-records', weatherRoutes);

module.exports = app;
