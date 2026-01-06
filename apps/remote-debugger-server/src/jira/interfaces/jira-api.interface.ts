/**
 * Jira API 응답 타입 정의
 * Jira REST API v3 스펙 기반
 */

/**
 * Jira 프로젝트 응답
 */
export interface JiraProject {
  /** 프로젝트 키 (예: PROJ) */
  key: string;
  /** 프로젝트 ID */
  id: string;
  /** 프로젝트 이름 */
  name: string;
  /** 프로젝트 리소스 URL */
  self: string;
}

/**
 * Jira 이슈(티켓) 생성 응답
 */
export interface JiraIssueResponse {
  /** 이슈 키 (예: PROJ-123) */
  key: string;
  /** 이슈 ID */
  id: string;
  /** 이슈 리소스 URL */
  self: string;
}
