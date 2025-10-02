require('dotenv').config();
const express = require("express");
const session = require("express-session");
const path = require('path');

const app = express();

// (Mongo solo si no es test)
if (process.env.NODE_ENV !== 'test') {
  const mongoose = require("mongoose");
  if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log("Conectado a MongoDB"))
      .catch(err => console.error("❌ Error de conexión a MongoDB:", err.message));
  }
}

// Middlewares base
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: 'secreto-super-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 5 * 60 * 1000 }
}));

app.use((req, _res, next) => {
  if (req.session) { req.session._garbage = Date(); req.session.touch(); }
  next();
});

app.use((req, res, next) => {
  res.locals.nombre = req.session?.user?.nombre || null;
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// === RUTAS IGUAL QUE EN TU server.js ===
// Login y auth inline (idéntico a tu server.js)
const { pool } = require('./config/conexion');
const axios = require("axios");
const bcrypt = require('bcrypt');

// GET login
app.get("/", (req, res) => {
  const error = req.session.errorLogin || null;
  delete req.session.errorLogin;
  res.render("login", { titulo: "Inicio de sesión", error });
});

// POST login (recomiendo esta versión con bcrypt.compare)
app.post("/login", async (req, res) => {
  const { userType, username, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE correo = ? AND rol = ?",
      [username, userType]
    );
    if (rows.length === 0) {
      req.session.errorLogin = "User or password incorrect";
      return res.redirect('/');
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.contra);
    if (!ok) {
      req.session.errorLogin = "User or password incorrect";
      return res.redirect('/');
    }
    req.session.user = { id: user.ID, nombre: user.nombre, rol: user.rol, correo: user.correo };
    if (user.rol === 'cliente') return res.redirect('/cliente');
    if (user.rol === 'coordinador') return res.redirect('/coordinador');
    if (user.rol === 'tecnico') return res.redirect('/tecnico');
    return res.redirect('/');
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).send("Error en el servidor");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error("Error al cerrar sesión:", err);
    res.redirect("/");
  });
});

// Rutas de tu proyecto
app.use(require('./routes/cliente'));
app.use('/tecnico', require('./routes/tecnicos'));
// --- API del técnico: obtener TR por id (protegido) ---
app.get("/api/tr/:id", async (req, res) => {
  if (!req.session.user || req.session.user.rol !== 'tecnico') {
    return res.status(401).json({ error: "No autorizado" });
  }
  const trId = req.params.id;
  const tecnicoId = req.session.user.id;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM test_requests WHERE ID = ? AND tecnico_id = ?",
      [trId, tecnicoId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "TR no encontrada o no asignada a ti" });
    }
    const tr = rows[0];
    res.json({
      tipo_prueba: tr.tipo_prueba,
      estandar: tr.standar,
      familia: tr.familia,
      calibre: tr.calibre,
      color: tr.color
    });
  } catch (error) {
    console.error("❌ Error en /api/tr/:id", error.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// --- Coordinador: actualizar estatus y notificar ---
app.post("/coordinador/estatus/:id", async (req, res) => {
  if (!req.session.user || req.session.user.rol !== 'coordinador') {
    return res.redirect('/');
  }
  const solicitudId = req.params.id;
  const nuevoEstatus = req.body.estatus;

  try {
    await axios.post('http://localhost:5000/notificar_cliente', {
      prueba_id: solicitudId,
      nuevo_estatus: nuevoEstatus
    });

    await pool.query(
      "UPDATE test_requests SET estatus = ? WHERE ID = ?",
      [nuevoEstatus, solicitudId]
    );

    req.session.mensaje = `El estatus de la solicitud TR-${solicitudId} fue actualizado a "${nuevoEstatus.toUpperCase()}".`;
    res.redirect("/coordinador?id=" + solicitudId);
  } catch (error) {
    console.error(" Error al actualizar estatus:", error.message);
    res.status(500).send("Error al actualizar estatus");
  }
});


// 404
app.use((req, res) => res.status(404).render("404", { titulo: "Página no encontrada" }));

module.exports = app;
