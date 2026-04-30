import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsObject, IsArray } from "class-validator";

export class IkuResultCreateDto {
  @IsNotEmpty({ message: "idIku is required" })
  @IsString({ message: "idIku must be a string" })
  idIku!: string;

  @IsNotEmpty({ message: "month is required" })
  @IsInt({ message: "month must be an integer" })
  month!: number;

  @IsNotEmpty({ message: "year is required" })
  @IsInt({ message: "year must be an integer" })
  year!: number;

  @IsOptional()
  @IsNumber({}, { message: "calculatedValue must be numeric" })
  calculatedValue?: number;

  @IsOptional()
  @IsString({ message: "textValue must be a string" })
  textValue?: string;

  @IsOptional()
  @IsArray({ message: "documentIds must be an array" })
  @IsString({ each: true, message: "Each documentId must be a string" })
  documentIds?: string[];

  @IsOptional()
  @IsObject({ message: "metadata must be a JSON object" })
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString({ message: "formulaVersion must be a string" })
  formulaVersion?: string;

  @IsOptional()
  @IsDateString({}, { message: "calculatedAt must be an ISO datetime string" })
  calculatedAt?: string;
}

export class IkuResultUpdateDto {
  @IsOptional()
  @IsNumber({}, { message: "calculatedValue must be numeric" })
  calculatedValue?: number;

  @IsOptional()
  @IsString({ message: "textValue must be a string" })
  textValue?: string;

  @IsOptional()
  @IsArray({ message: "documentIds must be an array" })
  @IsString({ each: true, message: "Each documentId must be a string" })
  documentIds?: string[];

  @IsOptional()
  @IsObject({ message: "metadata must be a JSON object" })
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString({ message: "formulaVersion must be a string" })
  formulaVersion?: string;

  @IsOptional()
  @IsDateString({}, { message: "calculatedAt must be an ISO datetime string" })
  calculatedAt?: string;
}
