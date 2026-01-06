import { IsArray, IsString, IsNotEmpty } from "class-validator";

/**
 * 여러 세션 이벤트 저장 요청 DTO
 */
export class SaveMultipleSessionsDto {
  /**
   * rrweb.pack()으로 생성된 packed strings 배열
   * @example ["packed_event_1", "packed_event_2"]
   */
  @IsArray()
  @IsString({ each: true })
  packed: string[];

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
