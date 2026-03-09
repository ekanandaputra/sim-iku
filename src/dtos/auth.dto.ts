import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class RegisterDto {
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Email must be a valid email address" })
  email!: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password must be a string" })
  @Length(6, 128, { message: "Password must be at least 6 characters" })
  password!: string;

  @IsOptional()
  @IsString({ message: "Name must be a string" })
  @Length(1, 200, { message: "Name must be at most 200 characters" })
  name?: string;
}

export class LoginDto {
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Email must be a valid email address" })
  email!: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password must be a string" })
  password!: string;
}
