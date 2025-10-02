// importar la versión de promise de MYSQL2
const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Solo carga .env si NO estás en producción
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: process.env.DOTENV_PATH || path.resolve(__dirname, '../.env') });
}

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

// logs de depuración
console.log("Usuario: ", process.env.DB_USER);
console.log("Contrasena: ", process.env.DB_PASS);
console.log("Base de datos: ", process.env.DB_NAME);
