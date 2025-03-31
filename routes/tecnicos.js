const express = require("express");
const router = express.Router();
const { pool } = require("../config/conexion");

// Ruta POST para guardar resultados en MongoDB (ya existente, lo mantienes)
const TestLog = require("../models/TestLog");

router.post("/guardar-resultados", async (req, res) => {
  const {
    test_request_id,
    technician_id,
    environment,
    cable_info,
    tests,
    comments,
    start_time,
    end_time
  } = req.body;

  try {
    const log = new TestLog({
      test_request_id,
      technician_id,
      environment,
      cable_info,
      tests,
      comments,
      start_time,
      end_time
    });

    await log.save();

    res.status(200).json({ mensaje: "Guardado en MongoDB correctamente ✅" });
  } catch (error) {
    console.error(" Error:", error.message);
    res.status(500).json({ error: "Error al guardar en MongoDB" });
  }
});

// ✅ Nueva ruta para obtener pruebas dinámicas por solicitud
router.get('/api/pruebas/:requestId', async (req, res) => {
  const requestId = req.params.requestId;

  try {
    const [pruebas] = await pool.query(
      "SELECT * FROM test_details WHERE request_id = ?",
      [requestId]
    );
    res.json(pruebas);
  } catch (error) {
    console.error("Error al cargar pruebas:", error.message);
    res.status(500).json({ error: "Error al obtener pruebas" });
  }
});

module.exports = router;
