// server.js

const app = require('./app');
const port = process.env.PORT || 55080;
app.listen(port, () => console.log(`Servidor corriendo en http://localhost:${port}`));

/*
// Elimina la conexión a MongoDB temporalmente
// Configuración del servidor
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const session = require("express-session");
// const mongoose = require("mongoose"); // Eliminar MongoDB por ahora
const { pool } = require('./config/conexion');
const axios = require("axios");
const PDFDocument = require("pdfkit");
const TestLog = require("./models/TestLog");

// Cargar variables de entorno
dotenv.config();

// Conexion MongoDB eliminada temporalmente
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("Conectado a MongoDB"))
//   .catch(err => console.error("❌ Error de conexión a MongoDB:", err.message));

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

app.get("/", (req, res) => {
  const error = req.session.errorLogin || null;
  delete req.session.errorLogin;
  res.render("login", { titulo: "Inicio de sesión", error });
});

// Login y auth inline (idéntico a tu server.js)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Simplificamos la verificación de login
    if (username === 'admin' && password === 'admin') {
      req.session.user = { id: 1, nombre: 'Admin', rol: 'coordinador' }; // Ejemplo de sesión de login
      res.redirect('/coordinador');
    } else {
      req.session.errorLogin = "Usuario o contraseña incorrectos";
      res.redirect('/');
    }
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).send("Error en el servidor");
  }
});

// Rutas adicionales...*/
