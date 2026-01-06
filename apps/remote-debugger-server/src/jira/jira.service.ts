import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { parseZigzagUserAgent } from "src/utils/browser/useragent";
import { jiraGet, jiraPost } from "src/utils/jira/jira-client.util";
import {
  JiraProject,
  JiraIssueResponse,
} from "./interfaces/jira-api.interface";

@Injectable()
export class JiraService {
  private readonly logger = new Logger(JiraService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * jira 프로젝트 리스트 조회
   * @returns 프로젝트 키, 프로젝트 명 2가지 정보만 반환합니다.
   */
  async getProjectList(): Promise<Pick<JiraProject, "key" | "name">[]> {
    const projects = await jiraGet<JiraProject[]>(
      this.httpService,
      "/rest/api/3/project"
    );

    if (!projects) {
      this.logger.warn("프로젝트 목록 조회 실패");
      return [];
    }

    return projects.map((project) => ({
      key: project.key,
      name: project.name,
    }));
  }

  /**
   * Jira 티켓 생성
   * @param eventId - 이벤트 ID
   * @param jiraProjectKey - Jira 프로젝트 키
   * @param userAgent - User Agent 문자열
   * @returns 생성된 티켓 URL
   */
  async createTicket(
    eventId: number,
    jiraProjectKey: string,
    userAgent: string
  ): Promise<string | null> {
    try {
      const parsedUserAgent = parseZigzagUserAgent(userAgent);
      const viewerLink = `http://localhost:5173/viewer?eventId=${eventId}`;
      const descriptionContent = this.buildTicketDescription({
        eventId,
        viewerLink,
        parsedUserAgent,
        userAgent,
      });

      const response = await jiraPost<JiraIssueResponse>(
        this.httpService,
        "/rest/api/3/issue",
        {
          fields: {
            project: {
              key: jiraProjectKey,
            },
            summary: `RRWeb event: ${eventId}`,
            description: {
              type: "doc",
              version: 1,
              content: descriptionContent,
            },
            issuetype: {
              name: "Task",
            },
          },
        }
      );

      if (!response) {
        this.logger.warn("Jira 티켓 생성 후 응답이 존재하지 않습니다");
        return null;
      }

      this.logger.log(`Jira 티켓 생성 완료: ${response.data.key}`);
      return `${response.jiraApiUrl}/browse/${response.data.key}`;
    } catch (error) {
      this.logger.error(`Jira 티켓 생성 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Jira 티켓 Description 생성 (ADF 형식)
   * @param eventId - 이벤트 ID
   * @param viewerLink - 뷰어 링크
   * @param parsedUserAgent - 파싱된 User Agent 정보
   * @param userAgent - 원본 User Agent 문자열
   * @returns ADF 형식의 description content
   */
  private buildTicketDescription({
    eventId,
    viewerLink,
    parsedUserAgent,
    userAgent,
  }: {
    eventId: number;
    viewerLink: string;
    parsedUserAgent: ReturnType<typeof parseZigzagUserAgent>;
    userAgent: string;
  }): any[] {
    return [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "세션 정보" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "저장된 RRWeb 세션 재생 정보입니다." }],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "세션 ID: ",
                    marks: [{ type: "strong" }],
                  },
                  {
                    type: "text",
                    text: String(eventId),
                    marks: [{ type: "code" }],
                  },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "재생 링크: ",
                    marks: [{ type: "strong" }],
                  },
                  {
                    type: "text",
                    text: "세션 재생하기",
                    marks: [
                      {
                        type: "link",
                        attrs: {
                          href: viewerLink,
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "브라우저 정보" }],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "브라우저: ",
                    marks: [{ type: "strong" }],
                  },
                  {
                    type: "text",
                    text: `${parsedUserAgent.browser} ${parsedUserAgent.browserVersion || ""}`.trim(),
                  },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "기기 유형: ",
                    marks: [{ type: "strong" }],
                  },
                  {
                    type: "text",
                    text:
                      parsedUserAgent.deviceType === "mobile" ? "모바일" : "PC",
                  },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "WebView: ",
                    marks: [{ type: "strong" }],
                  },
                  {
                    type: "text",
                    text: parsedUserAgent.isWebView ? "예" : "아니오",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "운영체제 정보" }],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "운영체제: ",
                    marks: [{ type: "strong" }],
                  },
                  {
                    type: "text",
                    text: `${parsedUserAgent.os}${parsedUserAgent.osVersion ? ` ${parsedUserAgent.osVersion}` : ""}`,
                  },
                ],
              },
            ],
          },
          ...(parsedUserAgent.device
            ? [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "기기 모델: ",
                          marks: [{ type: "strong" }],
                        },
                        { type: "text", text: parsedUserAgent.device },
                      ],
                    },
                  ],
                },
              ]
            : []),
          ...(parsedUserAgent.appVersion
            ? [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "앱 버전: ",
                          marks: [{ type: "strong" }],
                        },
                        { type: "text", text: parsedUserAgent.appVersion },
                      ],
                    },
                  ],
                },
              ]
            : []),
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "원본 User Agent" }],
      },
      {
        type: "codeBlock",
        attrs: { language: "text" },
        content: [{ type: "text", text: userAgent }],
      },
    ];
  }
}
