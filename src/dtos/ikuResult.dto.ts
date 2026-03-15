import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class IkuResultCreateDto {
  @IsNotEmpty({ message: "idIku is required" })
  @IsString({ message: "idIku must be a string" })
  idIku!: string;

  @IsNotEmpty({ message: "idPeriod is required" })
  @IsInt({ message: "idPeriod must be an integer" })
  idPeriod!: number;

  @IsNotEmpty({ message: "calculatedValue is required" })
  @IsNumber({}, { message: "calculatedValue must be numeric" })
  calculatedValue!: number;

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
  @IsString({ message: "formulaVersion must be a string" })
  formulaVersion?: string;

  @IsOptional()
  @IsDateString({}, { message: "calculatedAt must be an ISO datetime string" })
  calculatedAt?: string;
}
