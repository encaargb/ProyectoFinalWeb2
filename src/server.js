require('dotenv').config();
const app = require('./app');
const {connectDB} = require('./config/db');

const PORT = process.env.PORT || 3000;

// El servidor primero conecta con MongoDB y solo después empieza a escuchar peticiones.
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
};

startServer();
