import { IsNotEmpty, IsString, IsArray, ArrayMinSize } from "class-validator";

export class AssignIkuUsersDto {
  @IsArray({ message: "userIds must be an array" })
  @ArrayMinSize(1, { message: "userIds must contain at least one user ID" })
  @IsString({ each: true, message: "Each userId must be a string" })
  userIds!: string[];
}
