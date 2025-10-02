// tests/404.test.js
const request = require("supertest");
const app = require("../app");

describe("GET ruta inexistente", () => {
  it("debe responder 404 y devolver HTML", async () => {
    const res = await request(app).get("/ruta-que-no-existe-abc123");

    expect(res.status).toBe(404);
    expect(res.type).toMatch(/html/);          // Content-Type: text/html
    expect(res.text).toMatch(/<!DOCTYPE html>/i); // HTML válido
  });
});
