import { IsInt, IsBoolean, IsOptional, IsString, Min, Max, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class TogglePeriodLockDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsInt()
  @Min(2000)
  year!: number;

  @IsBoolean()
  locked!: boolean;

  @IsOptional()
  @IsBoolean()
  allowAdminBypass?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkPeriodLockItemDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsBoolean()
  locked!: boolean;

  @IsOptional()
  @IsBoolean()
  allowAdminBypass?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkPeriodLockDto {
  @IsInt()
  @Min(2000)
  year!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkPeriodLockItemDto)
  locks!: BulkPeriodLockItemDto[];
}
