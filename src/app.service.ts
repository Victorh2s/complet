import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "./database/prisma.service";
import { User } from "prisma/generated";
import { CreateUserDto } from "./dtos/validation.dto";

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getUsers(): Promise<User[]> {
    return await this.prisma.user.findMany();
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
    return await this.prisma.user.delete({
      where: { email },
    });
  }
}
