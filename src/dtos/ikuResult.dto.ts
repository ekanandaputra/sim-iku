import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsObject } from "class-validator";

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

  /**
   * For unit: percentage | number
   * Either calculatedValue or metadata must be provided.
   */
  @IsOptional()
  @IsNumber({}, { message: "calculatedValue must be numeric" })
  calculatedValue?: number;

  /**
   * For unit: text  → { text: "string value" }
   * For unit: file  → { files: [{ documentId: "uuid", name: "filename" }, ...] }
   */
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
  @IsObject({ message: "metadata must be a JSON object" })
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString({ message: "formulaVersion must be a string" })
  formulaVersion?: string;

  @IsOptional()
  @IsDateString({}, { message: "calculatedAt must be an ISO datetime string" })
  calculatedAt?: string;
}
