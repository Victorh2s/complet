import { OmitType } from "@nestjs/mapped-types";
import { IsEmail, IsInt, IsString, Min, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsInt()
  @Min(18, { message: "Age must be at least 18" })
  age: number;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;
}

export class UpdateUserDto extends OmitType(CreateUserDto, [
  "password",
  "email",
] as const) {}
