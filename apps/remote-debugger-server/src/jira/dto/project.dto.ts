import { IsNotEmpty, IsString } from "class-validator";

/**
 * 지라 프로젝트 정보 DTO
 */
export class ProjectDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
