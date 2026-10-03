import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

const VIDEO_URL_PATTERN = /^https?:\/\/(www\.)?(youtube\.com\/|youtu\.be\/|drive\.google\.com\/|docs\.google\.com\/)/i;

export class GuideCreateDto {
  @IsNotEmpty({ message: "title is required" })
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(VIDEO_URL_PATTERN, { message: "videoUrl must be a valid YouTube or Google Drive link" })
  videoUrl?: string;
}

export class GuideUpdateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(VIDEO_URL_PATTERN, { message: "videoUrl must be a valid YouTube or Google Drive link" })
  videoUrl?: string;
}
