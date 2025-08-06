import { Test } from "@nestjs/testing";
import { PrismaService } from "./prisma.service";

if (process.env.NODE_ENV === "test") {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TESTE;
}

describe("PrismaService Integration", () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create and find a user", async () => {
    // Crie um usuário de teste
    await prisma.user.create({
      data: { email: "int@test.com", age: 22, password: "123456" },
    });

    // Busque o usuário
    const found = await prisma.user.findUnique({
      where: { email: "int@test.com" },
    });

    expect(found).toBeDefined();
    expect(found?.email).toBe("int@test.com");

    // Limpe o usuário criado
    await prisma.user.delete({ where: { email: "int@test.com" } });
  });
});
