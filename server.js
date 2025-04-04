// Configuración del servidor
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const session = require("express-session");
const mongoose = require("mongoose");
const { pool } = require('./config/conexion');
const axios = require("axios");
const PDFDocument = require("pdfkit");
const TestLog = require("./models/TestLog"); 


const port = 3000;

// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado a MongoOO"))
  .catch(err => console.error("❌ Error de conexión a MongoDB:", err.message));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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

app.use((req, res, next) => {
  res.locals.nombre = req.session?.user?.nombre || null;
  next();
});

// Motor de plantillas
app.set("view engine", "ejs");


//register
const bcrypt = require('bcrypt');

// GET - Mostrar formulario
app.get("/register", (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'coordinador') {
        return res.redirect('/');
    }

    res.render("register", { 
        titulo: "Registrar usuario",
        error: null // Para mostrar mensajes si los hay
    });
});

// POST - Guardar usuario
app.post("/register", async (req, res) => {
    const { nombre, correo, contra, rol } = req.body;

    // Validación de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

    if (!passwordRegex.test(contra)) {
        return res.render("register", {
            titulo: "Registrar usuario",
            error: "La contraseña debe contener al menos una letra mayúscula, una minúscula y un número."
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(contra, 10);

        await pool.query(
            "INSERT INTO users (nombre, correo, contra, rol) VALUES (?, ?, ?, ?)",
            [nombre, correo, hashedPassword, rol]
        );

        res.redirect("/coordinador");
    } catch (error) {
        console.error("Error al registrar usuario:", error.message);
        return res.render("register", {
            titulo: "Registrar usuario",
            error: "Ya existe una cuenta con este correo."
        });
        
    }
});


// Login
app.get("/", (req, res) => {
    const error = req.session.errorLogin || null;
    delete req.session.errorLogin;

    res.render("login", { titulo: "Inicio de sesión", error });
});


// Ruta para procesar login
app.post("/login", async (req, res) => {
    const { userType, username, password } = req.body;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE correo = ?",
            [username]
        );

        if (rows.length > 0) {
            const user = rows[0];

            // Si la contraseña no está cifrada la compara directamente
            if (user.contra === password) {
                // Si la contraseña es correcta se encripta y actualiza
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.query(
                    "UPDATE users SET contra = ? WHERE ID = ?",
                    [hashedPassword, user.ID]
                );
                
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
                // Si la contraseña está cifrada la compara con bcrypt
                const passwordMatch = await bcrypt.compare(password, user.contra);
                if (passwordMatch) {
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
                    req.session.errorLogin = "User or password incorrect";
                    return res.redirect('/');
                }
            }
        } else {
            req.session.errorLogin = "User or password incorrect";
            return res.redirect('/');
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

// About Us
app.get("/about", (req, res) => {
    res.render("about", { titulo: "About Us" });
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
app.get("/coordinador", async (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'coordinador') {
        return res.redirect('/');
    }

    const selectedId = req.query.id;
    const searchTerm = req.query.buscar;
    const mensaje = req.session.mensaje || null;
    delete req.session.mensaje;
    try {
        let solicitudes;

        if (searchTerm) {
            const query = `
                SELECT * FROM test_requests 
                WHERE ID LIKE ? OR solicitante LIKE ? 
                ORDER BY fecha_creacion DESC
            `;
            const likeTerm = `%${searchTerm}%`;
            const [result] = await pool.query(query, [likeTerm, likeTerm]);
            solicitudes = result;
        } else {
            const [result] = await pool.query("SELECT * FROM test_requests ORDER BY fecha_creacion DESC");
            solicitudes = result;
        }

        // Ver cuál mostrar a la derecha
        let solicitudSeleccionada = null;
        if (selectedId) {
            const [result] = await pool.query("SELECT * FROM test_requests WHERE ID = ?", [selectedId]);
            if (result.length > 0) solicitudSeleccionada = result[0];
        }
        const [tecnicos] = await pool.query("SELECT ID, nombre FROM users WHERE rol = 'tecnico'");
       
        res.render("coordinador", {
            titulo: "Coordinador",
            nombre: req.session.user.nombre,
            solicitudes,
            seleccionada: solicitudSeleccionada,
            mensaje,
            tecnicos
        });
        

    } catch (error) {
        console.error(" Error:", error.message);
        res.status(500).send("Error en el servidor");
    }
});




//Técnico
app.get("/tecnico", async (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'tecnico') {
      return res.redirect('/');
    }
  
    const tecnicoId = req.session.user.id;
  
    try {
      const [solicitudes] = await pool.query(
        "SELECT * FROM test_requests WHERE tecnico_id = ? ORDER BY fecha_creacion DESC",
        [tecnicoId]
      );
  
      let cableData = {};
      if (solicitudes.length > 0) {
        const selectedRequest = solicitudes[0];
  
        cableData = {
          id: selectedRequest.ID,
          familia: selectedRequest.familia,
          calibre: selectedRequest.calibre,
          color: selectedRequest.color,
          tipo_prueba: selectedRequest.tipo_prueba,
          estandar: selectedRequest.standar
        };
      }
  
      // Contar solicitudes "aprobado" y "completado"
      let countAprobado = 0;
      let countCompletado = 0;
  
      solicitudes.forEach(s => {
        if (s.estatus === "aprobado") countAprobado++;
        if (s.estatus === "completado") countCompletado++;
      });
  
      res.render("tecnico", {
        titulo: "Técnico",
        nombre: req.session.user.nombre,
        solicitudes,
        cableData,
        countAprobado,
        countCompletado
      });
  
    } catch (error) {
      console.error("❌ Error al cargar técnico:", error.message);
      res.status(500).send("Error al cargar datos del técnico");
    }
  });
  
  
  
  //Tecnico solicitudes
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

  
  app.post("/api/tr/:id/completar", async (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'tecnico') {
      return res.status(401).json({ error: "No autorizado" });
    }
  
    const trId = req.params.id;
    const tecnicoId = req.session.user.id;
    const { resultados } = req.body;
  
    if (!Array.isArray(resultados) || resultados.length !== 6 || resultados.some(r => r.trim() === "")) {
      return res.status(400).json({ error: "Todos los campos deben estar llenos." });
    }
  
    try {
      const [checkRows] = await pool.query(
        "SELECT * FROM test_requests WHERE ID = ? AND tecnico_id = ?",
        [trId, tecnicoId]
      );
  
      if (checkRows.length === 0) {
        return res.status(404).json({ error: "Solicitud no encontrada o no asignada al técnico." });
      }
  
      // ✅ Actualizar estatus a 'completado'
      await pool.query(
        "UPDATE test_requests SET estatus = 'completado' WHERE ID = ?",
        [trId]
      );
  
      res.json({ message: "Solicitud marcada como completada correctamente." });
    } catch (error) {
      console.error("❌ Error al completar solicitud:", error.message);
      res.status(500).json({ error: "Error en el servidor." });
    }
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
        console.error(" Error al actualizar solicitud:", error.message);
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



//ESTATUS DESDE COORDINADOR 
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

        // Guardar mensaje en sesión
        req.session.mensaje = `El estatus de la solicitud TR-${solicitudId} fue actualizado a "${nuevoEstatus.toUpperCase()}".`;

        res.redirect("/coordinador?id=" + solicitudId); 

    } catch (error) {
        console.error(" Error al actualizar estatus:", error.message);
        res.status(500).send("Error al actualizar estatus");
    }
});
app.post("/coordinador/asignar/:id", async (req, res) => {
    if (!req.session.user || req.session.user.rol !== 'coordinador') {
        return res.redirect('/');
    }

    const solicitudId = req.params.id;
    const tecnicoId = req.body.tecnico_id;

    try {
        await axios.post("http://localhost:5000/asignar_tecnico", {
            tecnico_id: tecnicoId,
            prueba_id: solicitudId
        });


        await pool.query(
            "UPDATE test_requests SET tecnico_id = ? WHERE ID = ?",
            [tecnicoId, solicitudId]
        );
        

        req.session.mensaje = `✅ Técnico asignado correctamente`;
        res.redirect(`/coordinador?id=${solicitudId}`);
    } catch (error) {
        console.error(" Error al asignar técnico:", error.message);
        res.status(500).send("Error al asignar técnico");
    }
});

const clienteRoutes = require('./routes/cliente');
app.use(clienteRoutes);

  


const tecnicoRoutes = require('./routes/tecnicos');
app.use('/tecnico', tecnicoRoutes);

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
