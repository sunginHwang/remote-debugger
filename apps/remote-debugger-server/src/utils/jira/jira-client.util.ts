import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

/**
 * Jira API 설정 인터페이스
 */
export interface JiraConfig {
  jiraApiUrl: string;
  jiraEmail: string;
  jiraApiToken: string;
}

/**
 * 환경변수에서 Jira 설정을 가져옵니다.
 * @returns Jira 설정 객체 또는 null (설정이 불완전한 경우)
 */
export function getJiraConfig(): JiraConfig | null {
  const jiraApiUrl = process.env.JIRA_API_URL;
  const jiraEmail = process.env.JIRA_EMAIL;
  const jiraApiToken = process.env.JIRA_API_TOKEN;

  if (!jiraApiUrl || !jiraEmail || !jiraApiToken) {
    return null;
  }

  return {
    jiraApiUrl,
    jiraEmail,
    jiraApiToken,
  };
}

/**
 * Jira API 호출을 위한 인증 헤더를 생성합니다.
 * @param jiraEmail - Jira 계정 이메일
 * @param jiraApiToken - Jira API 토큰
 * @returns HTTP 헤더 객체
 */
export function createJiraAuthHeaders(
  jiraEmail: string,
  jiraApiToken: string
): Record<string, string> {
  const credentials = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString(
    "base64"
  );

  return {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
  };
}

/**
 * Jira API GET 요청을 수행합니다.
 * @param httpService - NestJS HttpService 인스턴스
 * @param path - API 경로 (예: '/rest/api/3/project')
 * @returns 응답 데이터 또는 null (설정이 불완전한 경우)
 */
export async function jiraGet<T>(
  httpService: HttpService,
  path: string
): Promise<T | null> {
  const jiraConfig = getJiraConfig();

  if (!jiraConfig) {
    return null;
  }

  const { jiraApiUrl, jiraEmail, jiraApiToken } = jiraConfig;
  const headers = createJiraAuthHeaders(jiraEmail, jiraApiToken);

  const response = await firstValueFrom(
    httpService.get<T>(`${jiraApiUrl}${path}`, { headers })
  );

  return response.data;
}

/**
 * Jira API POST 요청을 수행합니다.
 * @param httpService - NestJS HttpService 인스턴스
 * @param path - API 경로 (예: '/rest/api/3/issue')
 * @param data - 요청 바디 데이터
 * @returns 응답 데이터, Jira API URL, 또는 null (설정이 불완전한 경우)
 */
export async function jiraPost<T>(
  httpService: HttpService,
  path: string,
  data: any
): Promise<{ data: T; jiraApiUrl: string } | null> {
  const jiraConfig = getJiraConfig();

  if (!jiraConfig) {
    return null;
  }

  const { jiraApiUrl, jiraEmail, jiraApiToken } = jiraConfig;
  const headers = createJiraAuthHeaders(jiraEmail, jiraApiToken);

  const response = await firstValueFrom(
    httpService.post<T>(`${jiraApiUrl}${path}`, data, { headers })
  );

  return { data: response.data, jiraApiUrl };
}
