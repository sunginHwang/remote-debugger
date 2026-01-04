import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

interface JiraTicketResponse {
  key: string;
  id: string;
  self: string;
}

@Injectable()
export class JiraService {
  private readonly logger = new Logger(JiraService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Jira 티켓 생성
   * @param sessionId - 세션 ID
   * @param projectKey - 프로젝트 키
   * @returns 생성된 티켓 키
   */
  async createTicket(
    sessionId: string,
    projectKey: string
  ): Promise<string | null> {
    try {
      const jiraApiUrl = process.env.JIRA_API_URL;
      const jiraEmail = process.env.JIRA_EMAIL;
      const jiraApiToken = process.env.JIRA_API_TOKEN;

      if (!jiraApiUrl || !jiraEmail || !jiraApiToken) {
        this.logger.warn(
          "Jira 설정이 완료되지 않았습니다. (JIRA_API_URL, JIRA_EMAIL, JIRA_API_TOKEN)"
        );
        return null;
      }

      const credentials = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString(
        "base64"
      );

      const response = await firstValueFrom(
        this.httpService.post<JiraTicketResponse>(
          `${jiraApiUrl}/rest/api/3/issue`,
          {
            fields: {
              project: {
                key: projectKey,
              },
              summary: `RRWeb Session: ${sessionId}`,
              description: {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: `저장된 세션 ID: ${sessionId}`,
                      },
                    ],
                  },
                ],
              },
              issuetype: {
                name: "Task",
              },
            },
          },
          {
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      this.logger.log(`Jira 티켓 생성 완료: ${response.data.key}`);
      return `${jiraApiUrl}/browse/${response.data.key}`;
    } catch (error) {
      this.logger.error(`Jira 티켓 생성 실패: ${error.message}`, error.stack);
      throw error;
    }
  }
}
