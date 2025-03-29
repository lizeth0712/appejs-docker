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

app.use(session({
    secret: 'secreto-super-seguro',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 }
}));
app.use((req, res, next) => {
    if (req.session) {
        req.session._garbage = Date();
        req.session.touch();
    }
    next();
});

// Middleware global para pasar nombre
app.use((req, res, next) => {
    res.locals.nombre = req.session?.user?.nombre || null;
    next();
});

// Motor de plantillas
app.set("view engine", "ejs");

// Login
app.get("/", (req, res) => {
    res.render("login", { titulo: "Inicio de sesión", error: null });
});

app.post("/login", async (req, res) => {
    const { userType, username, password } = req.body;
    try {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE correo = ? AND contra = ? AND rol = ?",
            [username, password, userType]
        );

        if (rows.length > 0) {
            const user = rows[0];
            req.session.user = {
                id: user.ID,
                nombre: user.nombre,
                rol: user.rol,
                correo: user.correo
            };

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

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) console.error("Error al cerrar sesión:", err);
        res.redirect("/");
    });
});

// Cliente
app.get("/cliente", async (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'cliente') {
        return res.redirect('/');
    }

    const userId = req.session.user.id;
    const searchId = req.query.search;

    try {
        let rows;

        if (searchId) {
            // Buscar por ID y verificar que pertenezca al usuario
            const [result] = await pool.query(
                "SELECT * FROM test_requests WHERE ID = ? AND solicitante = ?",
                [searchId, userId]
            );
            rows = result;
        } else {
            // Mostrar todos
            const [result] = await pool.query(
                "SELECT * FROM test_requests WHERE solicitante = ?",
                [userId]
            );
            rows = result;
        }

        res.render("cliente", {
            titulo: "Cliente",
            nombre: req.session.user.nombre,
            solicitudes: rows
        });

    } catch (error) {
        console.error("Error al obtener solicitudes:", error.message);
        res.status(500).send("Error en el servidor");
    }
});


// Coordinador
app.get("/coordinador", (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'coordinador') {
        return res.redirect('/');
    }
    res.render("coordinador", {
        titulo: "Coordinador",
        nombre: req.session.user.nombre
    });
});

// Técnico
app.get("/tecnico", (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'tecnico') {
        return res.redirect('/');
    }
    res.render("tecnico", {
        titulo: "Técnico",
        nombre: req.session.user.nombre
    });
});

// Vista para formulario
app.get("/add_new", (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'cliente') {
        return res.redirect('/');
    }
    res.render("add_new", {
        titulo: "Agregar",
        nombre: req.session.user.nombre
    });
});

// RUTA POST para guardar
app.post("/add_new", async (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'cliente') {
        return res.redirect('/');
    }

    const { planta, meta, familia, calibre, color, standar, tipo_prueba } = req.body;
    const fecha_creacion = new Date();
    const estatus = "pendiente";
    const solicitante = req.session.user.id;

    try {
        await pool.query(
            `INSERT INTO test_requests 
            (solicitante, standar, tipo_prueba, estatus, fecha_creacion, planta, meta, familia, calibre, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [solicitante, standar, tipo_prueba, estatus, fecha_creacion, planta, meta, familia, calibre, color]
        );

        res.redirect('/cliente');
    } catch (error) {
        console.error(" Error al guardar solicitud:", error.message);
        res.status(500).send("Error al guardar la solicitud");
    }
});

//Editar Test Requests 
app.get("/edit/:id", async (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'cliente') {
        return res.redirect('/');
    }

    const testRequestId = req.params.id;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM test_requests WHERE ID = ? AND solicitante = ?",
            [testRequestId, req.session.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).send("Test request not found");
        }

        const solicitud = rows[0];

        res.render("edit", {
            titulo: "Editar Test Request",
            nombre: req.session.user.nombre,
            solicitud
        });

    } catch (error) {
        console.error("Error al cargar solicitud:", error.message);
        res.status(500).send("Error al cargar la solicitud");
    }
});

//Guardar cambios EDIT 
app.post("/edit/:id", async (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'cliente') {
        return res.redirect('/');
    }

    const testRequestId = req.params.id;
    const { planta, meta, familia, calibre, color, standar, tipo_prueba } = req.body;

    try {
        await pool.query(
            `UPDATE test_requests SET 
            planta = ?, meta = ?, familia = ?, calibre = ?, color = ?, standar = ?, tipo_prueba = ?
            WHERE ID = ? AND solicitante = ?`,
            [planta, meta, familia, calibre, color, standar, tipo_prueba, testRequestId, req.session.user.id]
        );

        res.redirect("/cliente");
    } catch (error) {
        console.error("❌ Error al actualizar solicitud:", error.message);
        res.status(500).send("Error al actualizar la solicitud");
    }
});


//ELIMINAR solicitud 
app.post("/delete/:id", async (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'cliente') {
        return res.redirect('/');
    }

    const testRequestId = req.params.id;
    const userId = req.session.user.id;

    try {
        const [result] = await pool.query(
            "DELETE FROM test_requests WHERE ID = ? AND solicitante = ?",
            [testRequestId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send("Solicitud no encontrada o no autorizada.");
        }

        res.redirect("/cliente");
    } catch (error) {
        console.error(" Error al eliminar solicitud:", error.message);
        res.status(500).send("Error al eliminar la solicitud");
    }
});

// Página About
app.get("/about", (req, res) => {
    res.render("about", { titulo: "Acerca de Nosotros" });
});

app.use((req, res) => {
    res.status(404).render("404", { titulo: "Página no encontrada" });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
