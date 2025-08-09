import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "./database/prisma.service";
import { User } from "../prisma/generated";
import { CreateUserDto } from "./dtos/validation.dto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { MailerService } from "@nestjs-modules/mailer";
import { logger } from "@sentry/nestjs";

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly mailerService: MailerService,
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

  async createUsers({
    email,
    age,
    password,
  }: CreateUserDto): Promise<User | null> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new HttpException("Usuário já existe", HttpStatus.CONFLICT);
      }
      await this.cacheManager.del("users:all");

      await this.prisma.user.create({
        data: {
          email,
          age,
          password,
        },
      });
      console.log(`Usuário ${email} criado com sucesso.`);
      await this.sendTestEmail(email);
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      logger.error(`Falha ao criar usuário: ${error.message}`);
      throw new HttpException(
        `Falha ao criar usuário: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUsers(email: string, age: number): Promise<User> {
    try {
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
    } catch (error) {
      logger.error(`Falha ao atualizar usuário: ${error.message}`);

      throw new HttpException(
        `Falha ao atualizar usuário: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteUsers(email: string): Promise<User> {
    try {
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
    } catch (error) {
      logger.error(`Falha ao deletar usuário: ${error.message}`);

      throw new HttpException(
        `Falha ao deletar usuário ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendTestEmail(to: string) {
    try {
      Logger.debug(`Enviando email de teste para ${to}`);
      await this.mailerService.sendMail({
        to,
        from: `"Complet - Prowtech Solutions" <${process.env.EMAIL}>`,
        subject: "Sua conta foi criada com sucesso na Complet",
        text: `Olá! Sua conta foi criada com sucesso na Complet.`,
        html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px;">
          <p><strong>Olá!</strong></p>
          <p>Sua conta foi criada com sucesso na <b>Complet</b>.</p>
          <p>Se não foi você que realizou o cadastro, entre em contato com nosso suporte imediatamente.</p>
        </div>
      `,
      });

      return { success: true };
    } catch (error) {
      Logger.error(`Falha ao enviar email: ${error.message}`);
      logger.error(`Falha ao enviar email: ${error.message}`, {
        extra: { to, error: error.message },
      });
    }
  }
}
