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

}