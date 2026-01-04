import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { SessionEvent } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SlackService } from "../slack/slack.service";
import { JiraService } from "../jira/jira.service";

@Injectable()
export class RrwebService {
  private readonly logger = new Logger(RrwebService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slackService: SlackService,
    private readonly jiraService: JiraService
  ) {}

  /**
   * Save a session replay event to the database
   * @param sessionId - Unique session identifier
   * @param eventData - rrweb event data (will be stored as JSONB)
   * @returns Created session event
   */
  async savePackedEvent(
    sessionId: string,
    packedEventData: string
  ): Promise<SessionEvent> {
    const event = await this.prisma.sessionEvent.create({
      data: {
        sessionId,
        eventData: packedEventData,
        timestamp: Date.now(),
      },
    });

    const tempJiraProjectKey = "ADFE";

    // 패킷 저장 후 외부 API 호출 (비동기, 실패해도 저장은 성공)
    this.notifyExternalServices(sessionId, 1, tempJiraProjectKey).catch(
      (error) => {
        this.logger.error(
          `외부 서비스 알림 실패 (세션: ${sessionId}):`,
          error.stack
        );
      }
    );

    return event;
  }

  /**
   * Save multiple packed events to the database
   * @param sessionId - Unique session identifier
   * @param packedEvents - Array of packed event data
   * @returns Array of created session events
   */
  async savePackedEvents(
    sessionId: string,
    packedEvents: string[]
  ): Promise<SessionEvent[]> {
    const now = Date.now();
    // Use createManyAndReturn if available (Prisma 5.0+), otherwise use individual creates
    let events: SessionEvent[];
    try {
      events = await this.prisma.sessionEvent.createManyAndReturn({
        data: packedEvents.map((packedEventData) => ({
          sessionId,
          eventData: packedEventData,
          timestamp: now,
        })),
      });
    } catch {
      // Fallback: create individually if createManyAndReturn is not available
      events = await Promise.all(
        packedEvents.map((packedEventData) =>
          this.prisma.sessionEvent.create({
            data: {
              sessionId,
              eventData: packedEventData,
              timestamp: now,
            },
          })
        )
      );
    }

    return events;
  }

  /**
   * 외부 서비스에 알림 전송 (Slack, Jira)
   * @param sessionId - 세션 ID
   * @param eventCount - 저장된 이벤트 개수
   */
  private async notifyExternalServices(
    sessionId: string,
    eventCount: number,
    jiraProjectKey: string
  ): Promise<void> {
    const jiraTicketLink = await this.jiraService
      .createTicket(sessionId, jiraProjectKey)
      .catch((error) => {
        this.logger.warn(`Jira 티켓 생성 실패: ${error.message}`);
      });

    const slackMessage = `이벤트 생성 완료! ${jiraTicketLink}`;

    this.slackService
      .sendNotification(slackMessage, sessionId)
      .catch((error) => {
        this.logger.warn(`Slack 알림 실패: ${error.message}`);
      });
  }

  /**
   * Get all events for a specific session
   * @param sessionId - Session identifier
   * @returns Array of session events ordered by timestamp
   */
  async getEventsBySession(sessionId: string): Promise<SessionEvent[]> {
    return this.prisma.sessionEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    });
  }

  /**
   * Get a single event by ID
   * @param id - Event ID
   * @returns Session event
   */
  async getEventById(id: number): Promise<SessionEvent> {
    const event = await this.prisma.sessionEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  /**
   * Delete all events for a specific session
   * @param sessionId - Session identifier
   * @returns Number of deleted events
   */
  async deleteEventsBySession(sessionId: string): Promise<number> {
    const result = await this.prisma.sessionEvent.deleteMany({
      where: { sessionId },
    });

    return result.count;
  }

  /**
   * Delete a specific event by ID
   * @param id - Event ID
   * @returns Deleted event
   */
  async deleteEventById(id: number): Promise<SessionEvent> {
    try {
      return await this.prisma.sessionEvent.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }

  /**
   * Get events within a time range
   * @param startTime - Start timestamp
   * @param endTime - End timestamp
   * @returns Array of session events
   */
  async getEventsByTimeRange(
    startTime: number,
    endTime: number
  ): Promise<SessionEvent[]> {
    return this.prisma.sessionEvent.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: { timestamp: "asc" },
    });
  }
}
