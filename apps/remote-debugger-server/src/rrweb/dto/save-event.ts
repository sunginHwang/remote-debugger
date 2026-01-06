import { IsString, IsNotEmpty } from "class-validator";

/**
 * 이벤트 저장 요청 DTO
 */
export class SaveEventDto {
  /**
   * rrweb.pack()으로 생성된 packed string
   * @example "packed_event_data_string"
   */
  @IsString()
  @IsNotEmpty()
  packed: string;

  /**
   * 세션 ID (유니크)
   * @example "session_123"
   */
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  /**
   * Jira 프로젝트 키
   * @example "ADFE"
   */
  @IsString()
  @IsNotEmpty()
  jiraProjectKey: string;

  /**
   * User Agent 문자열
   * @example "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
   */
  @IsString()
  @IsNotEmpty()
  userAgent: string;
}
