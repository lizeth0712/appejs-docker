// Configuración del servidor
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const session = require("express-session");
const { pool } = require('./config/conexion');

const port = 3000;

// Cargar variables de entorno
dotenv.config();

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configurar express-session
app.use(session({
    secret: 'secreto-super-seguro',
    resave: false,
    saveUninitialized: false
}));

// Configurar motor de plantillas EJS
app.set("view engine", "ejs");

// Ruta principal (login)
app.get("/", (req, res) => {
    res.render("login", { titulo: "Inicio de sesión", error: null });
});

// Ruta para procesar login
app.post("/login", async (req, res) => {
    const { userType, username, password } = req.body;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE correo = ? AND contra = ? AND rol = ?",
            [username, password, userType]
        );

        if (rows.length > 0) {
            const user = rows[0];

            // Guardar datos en la sesión
            req.session.user = {
                nombre: user.nombre,
                rol: user.rol,
                correo: user.correo
            };

            // redireccion depende el rol
            if (user.rol === 'cliente') return res.redirect('/cliente');
            if (user.rol === 'coordinador') return res.redirect('/coordinador');
            if (user.rol === 'tecnico') return res.redirect('/tecnico');
        } else {
            res.render("login", { titulo: "Inicio de sesión", error: "Usuario o contraseña incorrectos" });
        }
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).send("Error en el servidor");
    }
});

// Cerrar sesión
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
        }
        res.redirect("/");
    });
});

// Ruta protegida p/cliente
app.get("/cliente", (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'cliente') {
        return res.redirect('/');
    }
    res.render("cliente", {
        titulo: "Cliente",
        nombre: req.session.user.nombre
    });
});

// Ruta protegida p/coordinador
app.get("/coordinador", (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'coordinador') {
        return res.redirect('/');
    }
    res.render("coordinador", {
        titulo: "Coordinador",
        nombre: req.session.user.nombre
    });
});

// Ruta protegida p/tecnico
app.get("/tecnico", (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'tecnico') {
        return res.redirect('/');
    }
    res.render("tecnico", {
        titulo: "Técnico",
        nombre: req.session.user.nombre
    });
});


app.get("/add_new", (req, res) => {
    res.render("add_new", { titulo: "Agregar" });
});

// 
app.get("/about", (req, res) => {
    res.render("about", { titulo: "Acerca de Nosotros" });
});


app.use((req, res) => {
    res.status(404).render("404", { titulo: "Página no encontrada" });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
