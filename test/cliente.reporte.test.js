process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');

// Mock del modelo que requiere routes/cliente.js
jest.mock('../models/TestLog', () => ({
  findOne: jest.fn().mockResolvedValue({
    test_request_id: 55,
    start_time: new Date('2024-01-01T10:00:00Z'),
    end_time: new Date('2024-01-01T11:00:00Z'),
    cable_info: { color: 'Rojo', familia: 'A', calibre: '2.5' },
    environment: { temperature: '24C', humidity: '40%', pressure: '1atm' },
    tests: [{ valores: ['1','2'], promedio: '1.5', specs: 'OK', status: 'OK' }],
    comments: 'Sin observaciones'
  })
}));

describe('GET /cliente/reporte/:id', () => {
  test('devuelve PDF', async () => {
    const res = await request(app).get('/cliente/reporte/55').expect(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    console.log('✓ El cliente obtuvo su reporte en PDF');
  });
});
