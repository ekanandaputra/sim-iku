import { IsNotEmpty, IsString, IsArray, ArrayMinSize } from "class-validator";

export class AssignUsersDto {
  @IsArray({ message: "userIds must be an array" })
  @ArrayMinSize(1, { message: "userIds must contain at least one user ID" })
  @IsString({ each: true, message: "Each userId must be a string" })
  userIds!: string[];
}

export class UnassignUsersDto {
  @IsArray({ message: "userIds must be an array" })
  @ArrayMinSize(1, { message: "userIds must contain at least one user ID" })
  @IsString({ each: true, message: "Each userId must be a string" })
  userIds!: string[];
}
