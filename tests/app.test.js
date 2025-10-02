const request = require("supertest");
const app = require("../app");

describe("GET /", () => {
  it("debe responder 200 y renderizar el login", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    // opcional: buscar parte del HTML renderizado
    expect(res.text).toMatch(/Login/i);
  });
});
