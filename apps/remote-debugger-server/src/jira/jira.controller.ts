import { Controller, Get } from "@nestjs/common";
import { JiraService } from "./jira.service";
import { GetProjectListResponseDto } from "./dto/get-project-list.response.dto";

/**
 * 지라 관련 서비스 담당
 *
 * 컨트롤러
 */
@Controller("jira")
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  /**
   * 지라의 프로젝트 리스트 조회용
   */
  @Get("project-list")
  async getProjectList(): Promise<GetProjectListResponseDto> {
    const projectList = await this.jiraService.getProjectList();
    return { projectList };
  }
}
