// tests/auth.test.js
const request = require("supertest");
const app = require("../app");

// mock del pool MySQL usado por app.js
jest.mock("../config/conexion", () => ({
  pool: { query: jest.fn() }
}));

// mock de bcrypt
jest.mock("bcrypt", () => ({
  compare: jest.fn()
}));

const { pool } = require("../config/conexion");
const bcrypt = require("bcrypt");

describe("POST /login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirige a '/' cuando las credenciales son inválidas", async () => {
    // DB no encuentra usuario con ese correo/rol
    pool.query.mockResolvedValue([[]]); // filas vacías

    const res = await request(app)
      .post("/login")
      .send({
        userType: "cliente",
        username: "noexiste@dominio.com",
        password: "x"
      });

    // express hace redirect 302
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/");
  });

  it("redirige a '/tecnico' cuando login exitoso de un tecnico", async () => {
    // DB retorna un usuario técnico
    pool.query.mockResolvedValue([
      [
        {
          ID: 1,
          nombre: "lizeth",
          rol: "tecnico",
          correo: "lizeth@gmail.com",
          contra: "12345"
        }
      ]
    ]);
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post("/login")
      .send({
        userType: "tecnico",
        username: "lizeth@gmail.com",
        password: "12345"
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/tecnico");
  });
});
