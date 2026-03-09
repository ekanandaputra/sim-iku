import { IsNotEmpty, IsOptional, IsString, Length, IsUUID } from "class-validator";

export class IkuCreateDto {
  @IsNotEmpty({ message: "Code is required" })
  @IsString({ message: "Code must be a string" })
  @Length(1, 50, { message: "Code must be at most 50 characters" })
  code!: string;

  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @Length(1, 200, { message: "Name must be at most 200 characters" })
  name!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @Length(0, 500, { message: "Description must be at most 500 characters" })
  description?: string;
}

export class IkuUpdateDto {
  @IsNotEmpty({ message: "Code is required" })
  @IsString({ message: "Code must be a string" })
  @Length(1, 50, { message: "Code must be at most 50 characters" })
  code!: string;

  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @Length(1, 200, { message: "Name must be at most 200 characters" })
  name!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  @Length(0, 500, { message: "Description must be at most 500 characters" })
  description?: string;
}

export class IkuComponentMappingDto {
  @IsNotEmpty({ message: "Component ID is required" })
  @IsUUID("4", { message: "Component ID must be a valid UUID" })
  componentId!: string;
}
