// importar la versión de promise de MYSQL2
const mysql = require('mysql2/promise');

// cargar variables de entorno desde la raíz
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// configuración de conexión
const dbSetting = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME, 
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    connectionLimit: 10,
    queueLimit: 0
};

// crear el pool de conexiones
const pool = mysql.createPool(dbSetting);

// exportar el pool
module.exports = { pool };

console.log("Usuario: ", process.env.DB_USER);
console.log("Contrasena: ", process.env.DB_PASS);
console.log("Base de datos: ", process.env.DB_NAME);
