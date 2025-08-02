import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { AppService } from "./app.service";
import { CreateUserDto, UpdateUserDto } from "./dtos/validation.dto";

@Controller("users")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("list")
  async getUsers() {
    return this.appService.getUsers();
  }

  @Post("create")
  async createUsers(@Body() createUserDto: CreateUserDto) {
    return await this.appService.createUsers(createUserDto);
  }

  @Put("edit/:email")
  async updateUsers(
    @Param("email") email: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.appService.updateUsers(email, updateUserDto.age);
  }

  @Delete("delete/:email")
  async deleteUsers(@Param("email") email: string) {
    return await this.appService.deleteUsers(email);
  }
}
