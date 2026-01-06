import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { SessionEvent } from "@prisma/client";
import { SaveEventDto } from "./dto/save-event";
import {
  DeleteEventResponseDto,
  SaveEventResponseDto,
} from "./dto/session-response.dto";
import { RrwebService } from "./rrweb.service";

@Controller("rrweb")
export class RrwebController {
  constructor(private readonly rrwebService: RrwebService) {}

  /**
   * rrweb event 저장
   */
  @Post("events")
  async saveEvent(@Body() body: SaveEventDto): Promise<SaveEventResponseDto> {
    const { packed, sessionId, jiraProjectKey, userAgent } = body;
    const result = await this.rrwebService.saveEvent({
      sessionId,
      packedEventData: packed,
      jiraProjectKey,
      userAgent,
    });
    return { eventId: result.id };
  }

  /**
   * id 기반 event 조회
   */
  @Get("events/eventId")
  async getEvent(
    @Param("eventId") eventId: number
  ): Promise<SessionEvent | null> {
    return this.rrwebService.getEventById(eventId);
  }

  /**
   * id 기반 event 삭제
   */
  @Delete("events/:eventId")
  async deleteEvent(
    @Param("eventId") eventId: number
  ): Promise<DeleteEventResponseDto> {
    await this.rrwebService.deleteEventById(eventId);
    return { isDeleted: true };
  }
}
