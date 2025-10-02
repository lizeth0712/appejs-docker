// test/tecnico.api.test.js
process.env.NODE_ENV = 'test';
jest.mock('mongoose');
jest.mock('../config/conexion'); // mock pool

const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/conexion');
const bcrypt = require('bcrypt');

describe('GET /api/tr/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('se entró a la API del técnico sin sesión y devolvió 401', async () => {
    const res = await request(app).get('/api/tr/1').expect(401);
    expect(res.headers['content-type']).toMatch(/application\/json/i);
    expect(res.body.error).toMatch(/no autorizado/i);
    console.log('✓  Sin sesión: devolvió 401 correctamente');
  });

  test('se entró a la API del técnico y validó TR ajena con 404', async () => {
    // login técnico para generar sesión
    const hash = await bcrypt.hash('P4ssw0rd', 10);
    pool.query.mockResolvedValueOnce([[{
      ID: 9, nombre: 'Tec', rol: 'tecnico', correo: 't@acme.io', contra: hash
    }]]);
    const agent = request.agent(app);
    await agent.post('/login')
      .send({ userType:'tecnico', username:'t@acme.io', password:'P4ssw0rd' })
      .expect(302);

    // ahora el endpoint (TR NO pertenece al técnico)
    pool.query.mockResolvedValueOnce([[]]); // sin filas
    const res = await agent.get('/api/tr/123').expect(404);

    // Asegura que es JSON y contiene el mensaje
    expect(res.headers['content-type']).toMatch(/application\/json/i);
    expect(String(res.body.error)).toMatch(/no encontrada|no asignada/i);

    console.log('✓  Se entró a la API del técnico y devolvió 404 (TR ajena)');
  });
});
