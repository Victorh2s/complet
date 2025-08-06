/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { HttpException, HttpStatus } from "@nestjs/common";
import { AppService } from "./app.service";
import { PrismaService } from "./database/prisma.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { CreateUserDto } from "./dtos/validation.dto";
import { User } from "../prisma/generated";

describe("AppService", () => {
  let service: AppService;
  let prismaService: PrismaService;
  let cacheManager: any;

  const mockUser: User = {
    id: "1npm ",
    email: "test@example.com",
    age: 25,
    password: "password123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(() => Promise.resolve([])) as jest.Mock,
              findUnique: jest.fn(() => Promise.resolve(null)) as jest.Mock,
              create: jest.fn(() => Promise.resolve(mockUser)) as jest.Mock,
              update: jest.fn(() => Promise.resolve(mockUser)) as jest.Mock,
              delete: jest.fn(() => Promise.resolve(mockUser)) as jest.Mock,
            },
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getUsers", () => {
    it("should return users from cache if available", async () => {
      cacheManager.get.mockResolvedValue([mockUser]);

      const result = await service.getUsers();

      expect(result).toEqual([mockUser]);
      expect(cacheManager.get).toHaveBeenCalledWith("users:all");
      expect(prismaService.user.findMany).not.toHaveBeenCalled();
    });

    it("should fetch users from database and cache them if not in cache", async () => {
      cacheManager.get.mockResolvedValue(null);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.getUsers();

      expect(result).toEqual([mockUser]);
      expect(cacheManager.get).toHaveBeenCalledWith("users:all");
      expect(prismaService.user.findMany).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(
        "users:all",
        [mockUser],
        60000,
      );
    });
  });

  describe("createUsers", () => {
    const createUserDto: CreateUserDto = {
      email: "test@example.com",
      age: 25,
      password: "password123",
    };

    it("should create a new user", async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.createUsers(createUserDto);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
      expect(cacheManager.del).toHaveBeenCalledWith("users:all");
    });

    it("should throw conflict exception if user already exists", async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.createUsers(createUserDto)).rejects.toThrow(
        new HttpException(
          "User with this email already exists",
          HttpStatus.CONFLICT,
        ),
      );
    });
  });

  describe("updateUsers", () => {
    it("should update user age", async () => {
      const updatedUser = { ...mockUser, age: 30 };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateUsers(mockUser.email, 30);

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { email: mockUser.email },
        data: { age: 30 },
      });
      expect(cacheManager.del).toHaveBeenCalledWith("users:all");
    });

    it("should throw not found exception if user does not exist", async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateUsers("nonexistent@example.com", 30),
      ).rejects.toThrow(
        new HttpException("User not found", HttpStatus.NOT_FOUND),
      );
    });
  });

  describe("deleteUsers", () => {
    it("should delete a user", async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.deleteUsers(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(cacheManager.del).toHaveBeenCalledWith("users:all");
    });

    it("should throw not found exception if user does not exist", async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteUsers("nonexistent@example.com"),
      ).rejects.toThrow(
        new HttpException("User not found", HttpStatus.NOT_FOUND),
      );
    });
  });
});
