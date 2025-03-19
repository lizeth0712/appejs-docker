//importar la version de promise de MYSQL2
const mysql = require('mysql2/promise')

//jalar variables
const dotenv = require('dotenv')

dotenv.config();
const dbSetting = {
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME, 
    port: 3306,
    charset: 'utf8mb4',
    waitForConnection: true,
    connectionLimit: 10,
    queueLimit: 0
}

const pool = mysql.createPool(dbSetting)

module.exports =  {pool}

console.log("Usuario: ", process.env.DB_USER);
console.log("Contrasena: ", process.env.DB_PASS);
console.log("Base de datos: ", process.env.DB_NAME);