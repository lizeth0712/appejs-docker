require('dotenv').config();
const express = require("express");
const session = require("express-session");
const path = require('path');

const app = express();

// Eliminar la conexión a MongoDB
// const mongoose = require("mongoose");
// if (process.env.NODE_ENV !== 'test') {
//   if (process.env.MONGO_URI) {
//     mongoose.connect(process.env.MONGO_URI)
//       .then(() => console.log("Conectado a MongoDB"))
//       .catch(err => console.error("❌ Error de conexión a MongoDB:", err.message));
//   }
// }

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

// Ruta para el login
app.get("/", (req, res) => {
  const error = req.session.errorLogin || null;
  delete req.session.errorLogin;
  res.render("login", { titulo: "Inicio de sesión", error });
});

// Ruta POST para login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  // Simplificamos la verificación de login por ahora
  if (username === 'admin' && password === 'admin') {
    req.session.user = { id: 1, nombre: 'Admin', rol: 'coordinador' };
    return res.redirect('/coordinador');
  } else {
    req.session.errorLogin = "Usuario o contraseña incorrectos";
    return res.redirect('/');
  }
});

// 404 Página no encontrada
app.use((req, res) => res.status(404).render("404", { titulo: "Página no encontrada" }));

module.exports = app;
