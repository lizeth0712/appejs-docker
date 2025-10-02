// Mock robusto de mongoose para unit tests

// Un constructor Schema "vacío" que no hace nada, pero existe
class Schema {
  constructor(definition, options) {
    this.definition = definition;
    this.options = options;
  }
}

// mock de mongoose.model(...) que devuelve un "modelo" con métodos comunes
function model(name, schema) {
  // Por defecto, todos los métodos son jest.fn()
  const api = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    // para el uso con "new Model(...).save()"
    // permitimos que el test pueda sobreescribirlo si quiere
  };

  // Soporte para "new (mongoose.model(...))()"
  function Ctor(doc = {}) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue(this);
  }
  // Colgamos la API estática de la función
  return Object.assign(Ctor, api);
}

module.exports = {
  Schema,
  model,
  connect: jest.fn().mockResolvedValue(true),
  connection: { on: jest.fn(), once: jest.fn() }
};
