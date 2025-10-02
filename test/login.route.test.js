jest.mock('../models/TestLog', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/conexion');
const bcrypt = require('bcrypt');

jest.mock('../config/conexion'); // usa el mock del pool

describe('POST /login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('login exitoso tecnico', async () => {
    const hash = await bcrypt.hash('12345', 10);
    pool.query.mockResolvedValueOnce([[{ ID: 4, nombre: 'Lizeth Soto', rol: 'tecnico', correo: 'lizeth@gmail.com', contra: hash }]]);
    const res = await request(app)
      .post('/login')
      .send({ userType: 'tecnico', username: 'lizeth@gmail.com', password: '12345' })
      .expect(302);
    expect(res.headers.location).toBe('/tecnico');
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM users WHERE correo = ? AND rol = ?",
      ['lizeth@gmail.com', 'tecnico']
    );
    console.log('✓ se validaron credenciales correctas: redirigió a /tecnico');
  });


  test('credenciales invalidas', async () => {
    pool.query.mockResolvedValueOnce([[]]); // no user
    const res = await request(app)
      .post('/login')
      .send({ userType: 'cliente', username: 'x@x.com', password: 'x' })
      .expect(302);
    expect(res.headers.location).toBe('/');
     console.log('✓ intento fallido: credenciales inválidas -> /');
  });
});


