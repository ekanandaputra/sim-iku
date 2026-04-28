import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class TagCreateDto {
  @IsNotEmpty({ message: "name is required" })
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: "color must be a valid hex color (e.g. #3B82F6)" })
  color?: string;
}

export class TagUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: "color must be a valid hex color (e.g. #3B82F6)" })
  color?: string;
}
