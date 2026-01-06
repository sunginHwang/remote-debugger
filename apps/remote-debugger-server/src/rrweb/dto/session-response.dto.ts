import { IsString, IsNotEmpty } from "class-validator";

/**
 * 세션 저장 응답 DTO
 */
export class SaveEventResponseDto {
  /**
   * 저장된 rrweb event ID
   */
  @IsString()
  @IsNotEmpty()
  eventId: number;
}

/**
 * 세션 삭제 응답 DTO
 */
export class DeleteEventResponseDto {
  /**
   * 삭제 성공 여부
   */
  isDeleted: boolean;
}
