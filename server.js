// Configuracion de servidor
const express = require("express");
const app = express();
const dotenv = require("dotenv");
//Configurar el puerto
const port =3000;


//VARIABLES DE ENTORNO

dotenv.config()
 
//Configuracion para motor de plantillas EJS res.render("archivo")
app.set("view engine", "ejs");
 
//Sevir archivos estaticos -- carpeta public
app.use(express.static("public"))
 
//Definiendo la Ruta Principal
app.get("/",(req, res) =>{
    //mostrar la pagina views
    res.render("login", {nombre:"IDSM21", titulo:"Desarrollo Web Profesional"});
});
 
//Rutas de las Paginas
app.get("/about",(req,res)=>{
    res.render("about",{titulo:"Acerca de Nosotros"})
})
 
//Ruta Para el manejo de errores
app.use((req,res)=>{
    res.status(404).render("404",{titulo:"Pagina no encontrada"});
})
 
//Iniciar el servidor
app.listen(port,()=>{
    console.log(`Servidor en http://localhost:${port}`);
})