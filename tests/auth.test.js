const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

describe("Auth API", () => {
  let testUser = { username: "testuser", email: "test@example.com", password: "password123" };
  let token;

  
  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("User can register", async () => {
    const res = await request(app).post("/auth/register").send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
  });

  test("User cannot register with existing email", async () => {
    const res = await request(app).post("/auth/register").send(testUser);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("User already exists");
  });

  test("User can login", async () => {
    const res = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test("User cannot login with incorrect password", async () => {
    const res = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: "wrongpassword",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("User cannot login with non-existing email", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "nonexistent@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("User can access protected route after login", async () => {
    const res = await request(app)
      .get("/protected/profile")
      .set("Cookie", `token=${token}`); 
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  test("User cannot access protected route without token", async () => {
    const res = await request(app).get("/protected/profile");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("User can logout", async () => {
    const res = await request(app).post("/auth/logout").set("Cookie", `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");
  });
});
