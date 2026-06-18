import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from "class-validator";

export class CreateBidangDto {
  @IsString({ message: "code must be a string" })
  @IsNotEmpty({ message: "code is required" })
  code!: string;

  @IsString({ message: "name must be a string" })
  @IsNotEmpty({ message: "name is required" })
  name!: string;

  @IsString({ message: "description must be a string" })
  @IsOptional()
  description?: string;
}

export class UpdateBidangDto {
  @IsString({ message: "code must be a string" })
  @IsOptional()
  code?: string;

  @IsString({ message: "name must be a string" })
  @IsOptional()
  name?: string;

  @IsString({ message: "description must be a string" })
  @IsOptional()
  description?: string;
}

export class AssignBidangUsersDto {
  @IsArray({ message: "userIds must be an array" })
  @ArrayMinSize(1, { message: "userIds must contain at least one user ID" })
  @IsString({ each: true, message: "Each userId must be a string" })
  userIds!: string[];
}

export class AssignBidangIkusDto {
  @IsArray({ message: "ikuIds must be an array" })
  @ArrayMinSize(1, { message: "ikuIds must contain at least one IKU ID" })
  @IsString({ each: true, message: "Each ikuId must be a string" })
  ikuIds!: string[];
}

export class AssignBidangComponentsDto {
  @IsArray({ message: "componentIds must be an array" })
  @ArrayMinSize(1, { message: "componentIds must contain at least one component ID" })
  @IsString({ each: true, message: "Each componentId must be a string" })
  componentIds!: string[];
}
