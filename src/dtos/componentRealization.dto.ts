import { IsDecimal, IsInt, IsNotEmpty, IsNumber, Min, IsString } from "class-validator";

export class ComponentRealizationCreateDto {
  @IsNotEmpty({ message: "idComponent is required" })
  @IsNotEmpty()
  idComponent!: string;

  @IsNotEmpty({ message: "idPeriod is required" })
  @IsString({ message: "idPeriod must be a UUID string" })
  idPeriod!: string;

  @IsNotEmpty({ message: "value is required" })
  @IsNumber({}, { message: "value must be a numeric value" })
  value!: number;
}

export class ComponentRealizationUpdateDto {
  @IsNotEmpty({ message: "value is required" })
  @IsNumber({}, { message: "value must be a numeric value" })
  value!: number;
}
