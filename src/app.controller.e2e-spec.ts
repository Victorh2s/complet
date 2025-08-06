import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./app.module";
import { PrismaService } from "./database/prisma.service";
import { CreateUserDto } from "./dtos/validation.dto";

if (process.env.NODE_ENV === "test") {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TESTE;
}

describe("AppController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await prisma.user.deleteMany(); // Limpa o banco de dados antes dos testes
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/users (User endpoints)", () => {
    const testUser: CreateUserDto = {
      email: "test@example.com",
      age: 25,
      password: "password123",
    };

    it("should create a user (POST /users/create)", async () => {
      const response = await request(app.getHttpServer())
        .post("/users/create")
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty("email", testUser.email);
      expect(response.body).toHaveProperty("age", testUser.age);
    });

    it("should get all users (GET /users/list)", async () => {
      const response = await request(app.getHttpServer())
        .get("/users/list")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should update a user (PUT /users/edit/:email)", async () => {
      const newAge = 30;
      const response = await request(app.getHttpServer())
        .put(`/users/edit/${testUser.email}`)
        .send({ age: newAge })
        .expect(200);

      expect(response.body).toHaveProperty("age", newAge);
    });

    it("should delete a user (DELETE /users/delete/:email)", async () => {
      await request(app.getHttpServer())
        .delete(`/users/delete/${testUser.email}`)
        .expect(200);

      // Verifica se o usuário foi realmente deletado
      const deletedUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      expect(deletedUser).toBeNull();
    });

    it("should return 404 when trying to update non-existent user", async () => {
      await request(app.getHttpServer())
        .put("/users/edit/nonexistent@example.com")
        .send({ age: 30 })
        .expect(404);
    });
  });
});
