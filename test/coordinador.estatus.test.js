jest.mock('../models/TestLog', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/conexion');
const axios = require('axios');
const bcrypt = require('bcrypt');

jest.mock('../config/conexion');
jest.mock('axios');


describe('POST /coordinador/estatus/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('llama a Flask y actualiza estatus', async () => {
    // login coordinador
    pool.query.mockResolvedValueOnce([[{ ID: 2, nombre:'Coor', rol:'coordinador', correo:'c@acme.io', contra: await bcrypt.hash('Admin123',10) }]]);
    const agent = request.agent(app);
    await agent.post('/login').send({ userType:'coordinador', username:'c@acme.io', password:'Admin123' }).expect(302);

    axios.post.mockResolvedValueOnce({ status:200 });
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await agent
      .post('/coordinador/estatus/77')
      .send({ estatus: 'aprobado' })
      .expect(302);

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/notificar_cliente',
      { prueba_id: '77', nuevo_estatus: 'aprobado' }
    );
    expect(pool.query).toHaveBeenCalledWith(
      "UPDATE test_requests SET estatus = ? WHERE ID = ?",
      ['aprobado', '77']
    );
    expect(res.headers.location).toBe('/coordinador?id=77');
  });
});
