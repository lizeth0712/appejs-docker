const { pool } = require('./conexion');

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log(" Conexión exitosa a la BDD");
        const [rows] = await connection.query("SHOW TABLES");
        console.log("Tablas:", rows);
        connection.release();
    } catch (error) {
        console.error(" Error de conexión:", error);
    }
})();
