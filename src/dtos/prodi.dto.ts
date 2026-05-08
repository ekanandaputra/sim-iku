import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class ProdiCreateDto {
  @IsNotEmpty({ message: "code is required" })
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsNotEmpty({ message: "name is required" })
  @IsString()
  @MaxLength(200)
  name!: string;
}

export class ProdiUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
