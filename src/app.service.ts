import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "./database/prisma.service";
import { User } from "prisma/generated";
import { CreateUserDto } from "./dtos/validation.dto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async getUsers(): Promise<User[]> {
    const cacheKey = "users:all";

    const cached = await this.cacheManager.get<User[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const users = await this.prisma.user.findMany();

    await this.cacheManager.set(cacheKey, users, 1 * 60 * 1000); // 1 minute

    return users;
  }

  async createUsers({ email, age, password }: CreateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new HttpException(
        "User with this email already exists",
        HttpStatus.CONFLICT,
      );
    }
    await this.cacheManager.del("users:all");

    return await this.prisma.user.create({
      data: {
        email,
        age,
        password,
      },
    });
  }

  async updateUsers(email: string, age: number): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }

    await this.cacheManager.del("users:all");

    return await this.prisma.user.update({
      where: { email },
      data: { age },
    });
  }

  async deleteUsers(email: string): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }

    await this.cacheManager.del("users:all");

    return await this.prisma.user.delete({
      where: { email },
    });
  }
}
