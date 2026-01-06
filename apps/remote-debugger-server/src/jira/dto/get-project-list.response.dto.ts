import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { ProjectDto } from "./project.dto";

/**
 * 지라 프로젝트 리스트 조회 응답 DTO
 */
export class GetProjectListResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projectList: ProjectDto[];
}
