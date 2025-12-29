import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { RrwebService } from './rrweb.service';
import { SessionEvent } from '@prisma/client';

/**
 * DTO for saving packed rrweb events
 */
class SavePackedEventsDto {
  /**
   * Packed string from rrweb.pack()
   * @example "packed_event_data_string"
   */
  packed: string;

  /**
   * Session ID
   * @example "session_123"
   */
  sessionId: string;
}

/**
 * Response for saving packed events
 */
interface SavePackedEventsResponse {
  sessionId: string;
}

@Controller('rrweb')
export class RrwebController {
  constructor(private readonly rrwebService: RrwebService) {}

  /**
   * POST /rrweb/events
   * Save packed rrweb events (from rrweb.pack())
   *
   * Expected request:
   * - Content-Type: application/json
   * - X-Session-Id: <session-id> (header)
   * - Body: { packed: "packed_string_from_rrweb_pack" }
   *
   * @example
   * // Frontend code:
   * const packed = pack(events);
   *
   * fetch('/rrweb/events', {
   *   method: 'POST',
   *   headers: {
   *     'Content-Type': 'application/json',
   *     'X-Session-Id': 'session_123',
   *   },
   *   body: JSON.stringify({ packed }),
   * });
   */
  @Post('events')
  async savePackedEvents(
    @Body() {packed, sessionId}: SavePackedEventsDto,
  ): Promise<SavePackedEventsResponse> {
    // Process and save events
    const result = await this.rrwebService.savePackedEvent(sessionId, packed);
    return { sessionId: result.sessionId };
  }

  /**
   * GET /rrweb/sessions/:sessionId/events
   * Get all events for a specific session
   */
  @Get('sessions/:sessionId/events')
  async getEventsBySession(
    @Param('sessionId') sessionId: string,
  ): Promise<SessionEvent[]> {
    return this.rrwebService.getEventsBySession(sessionId);
  }

  /**
   * GET /rrweb/events/:id
   * Get a specific event by ID
   */
  @Get('events/:id')
  async getEventById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SessionEvent> {
    return this.rrwebService.getEventById(id);
  }

  /**
   * DELETE /rrweb/sessions/:sessionId/events
   * Delete all events for a specific session
   */
  @Delete('sessions/:sessionId/events')
  async deleteEventsBySession(
    @Param('sessionId') sessionId: string,
  ): Promise<{ deleted: number }> {
    const count = await this.rrwebService.deleteEventsBySession(sessionId);
    return { deleted: count };
  }

  /**
   * DELETE /rrweb/events/:id
   * Delete a specific event by ID
   */
  @Delete('events/:id')
  async deleteEventById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SessionEvent> {
    return this.rrwebService.deleteEventById(id);
  }

  /**
   * GET /rrweb/events?startTime=xxx&endTime=xxx
   * Get events within a time range
   */
  @Get('events')
  async getEventsByTimeRange(
    @Query('startTime', ParseIntPipe) startTime: number,
    @Query('endTime', ParseIntPipe) endTime: number,
  ): Promise<SessionEvent[]> {
    return this.rrwebService.getEventsByTimeRange(startTime, endTime);
  }
}
