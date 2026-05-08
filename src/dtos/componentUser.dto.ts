import { IsNotEmpty, IsString, IsArray, ArrayMinSize, IsOptional } from "class-validator";

export class AssignUsersDto {
  @IsArray({ message: "userIds must be an array" })
  @ArrayMinSize(1, { message: "userIds must contain at least one user ID" })
  @IsString({ each: true, message: "Each userId must be a string" })
  userIds!: string[];

  @IsString({ message: "prodiId must be a string" })
  @IsOptional()
  prodiId?: string;
}

export class UnassignUsersDto {
  @IsArray({ message: "userIds must be an array" })
  @ArrayMinSize(1, { message: "userIds must contain at least one user ID" })
  @IsString({ each: true, message: "Each userId must be a string" })
  userIds!: string[];

  @IsString({ message: "prodiId must be a string" })
  @IsOptional()
  prodiId?: string;
}
