const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const installationsRoutes = require('./routes/installations.routes');
const sportsRoutes = require('./routes/sports.routes');
const weatherRoutes = require('./routes/weather.routes');
const swaggerDocument = YAML.load('./docs/openapi.yaml');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Sports Facilities API is running' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/installations', installationsRoutes);
app.use('/sports', sportsRoutes);
app.use('/weather-records', weatherRoutes);

module.exports = app;


