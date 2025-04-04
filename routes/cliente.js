const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const TestLog = require("../models/TestLog");

// Ruta: Generar PDF por ID de solicitud
router.get("/cliente/reporte/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const log = await TestLog.findOne({ test_request_id: id });
    if (!log) {
      return res.status(404).send("No se encontraron resultados para esta solicitud.");
    }

    const doc = new PDFDocument({ margin: 40 });
    const filename = `test_report_${id}.pdf`;
    res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

   // Imagen/logo de la empresa
const logoPath = path.join(__dirname, "../public/img/logo.png");
if (fs.existsSync(logoPath)) {
  doc.image(logoPath, { width: 100, align: "center" });
  doc.moveDown();
}

    // Encabezado
    doc.fontSize(22).fillColor("#333").text("Reporte de Ensayo de Cable", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).fillColor("black").text(`ID de Solicitud: ${log.test_request_id}`);
    doc.text(`Inicio: ${new Date(log.start_time).toLocaleString()}`);
    doc.text(`Fin: ${new Date(log.end_time).toLocaleString()}`);
    doc.moveDown();

    // Tabla: Información del Cable
    doc.fontSize(14).fillColor("#000").text("Información del Cable", { underline: true });
    doc.moveDown(0.5);
    const cableInfo = [
      ["Color", log.cable_info.color || "-"],
      ["Familia", log.cable_info.familia || "-"],
      ["Calibre (mm)", log.cable_info.calibre || "-"]
    ];
    drawTable(doc, cableInfo);
    doc.moveDown();

    doc.fontSize(14).text("Condiciones Ambientales", { underline: true });
    doc.moveDown(0.5);
    const envInfo = [
      ["Temperatura", log.environment.temperature || "-"],
      ["Humedad", log.environment.humidity || "-"],
      ["Presión", log.environment.pressure || "-"]
    ];
    drawTable(doc, envInfo);
    doc.moveDown();

    doc.fontSize(14).text("Resultados de Pruebas", { underline: true });
    doc.moveDown(0.5);
    if (Array.isArray(log.tests)) {
      log.tests.forEach((test, i) => {
        const testData = [
          ["#", i + 1],
          ["Valores", test.valores?.join(", ") || "-"],
          ["Promedio", test.promedio || "-"],
          ["Especificaciones", test.specs || "-"],
          ["Estado", test.status || "-"]
        ];
        drawTable(doc, testData);
        doc.moveDown();
      });
    }

    // Comentarios
    if (log.comments) {
      doc.fontSize(14).text("Comentarios", { underline: true });
      doc.fontSize(12).text(log.comments);
    }

    doc.end();
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    res.status(500).send("Error al generar el PDF.");
  }
});

function drawTable(doc, rows) {
  const tableTop = doc.y;
  const cellPadding = 5;
  const rowHeight = 25;
  const colWidth = 250;

  rows.forEach((row, i) => {
    const y = tableTop + i * rowHeight;

    doc.rect(40, y, colWidth, rowHeight).stroke();
    doc.rect(40 + colWidth, y, colWidth, rowHeight).stroke();

    doc.text(row[0], 45, y + cellPadding, { width: colWidth - 10 });
    doc.text(row[1], 45 + colWidth, y + cellPadding, { width: colWidth - 10 });
  });

  doc.moveDown(rows.length * 0.6);
}

module.exports = router;
