import { OmitType } from "@nestjs/mapped-types";
import { IsEmail, IsInt, IsString, Min, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    example: "john.doe@example.com",
    description: "E-mail do usuário",
  })
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @ApiProperty({
    example: 25,
    description: "Idade do usuário (mínimo 18 anos)",
  })
  @IsInt({ message: "Age must be an integer" })
  @Min(18, { message: "Age must be at least 18" })
  age: number;

  @ApiProperty({
    example: "mySecurePassword",
    description: "Senha do usuário (mínimo 6 caracteres)",
  })
  @IsString({ message: "Password must be a string" })
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;
}

export class UpdateUserDto extends OmitType(CreateUserDto, [
  "password",
  "email",
] as const) {
  @ApiProperty({
    example: 30,
    description: "Idade atualizada do usuário",
    required: false,
  })
  age: number;
}
