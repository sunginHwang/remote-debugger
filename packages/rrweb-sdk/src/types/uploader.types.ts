/**
 * 업로드 페이로드 형식 (서버 API와 일치)
 */
export interface UploadPayload {
  /**
   * 이벤트를 패킹한 압축된 문자열을 의미합니다.
   */
  packed: string;
  /**
   * 세션 ID를 의미합니다.
   */
  sessionId: string;
  /**
   * 등록할 jira의 프로젝트 키 입니다,
   */
  jiraProjectKey: string;
  /**
   * 사용자 에이전트
   */
  userAgent: string;
}

/**
 * 서버로부터의 업로드 응답
 */
export interface UploadResponse {
  /**
   * 세션 ID를 의미합니다.
   */
  sessionId: string;
  /**
   * 저장된 이벤트 갯수를 의미합니다.
   */
  saved?: number;
}
