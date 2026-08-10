import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateVerificationDto {
  @IsNotEmpty()
  @IsString()
  entityId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
