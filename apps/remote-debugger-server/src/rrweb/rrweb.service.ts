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
   *  rrweb event 저장
   * @param sessionId - Unique session identifier
   * @param packedEventData - packed된 rrweb event data
   * @param jiraProjectKey - Jira 프로젝트 키
   * @param userAgent - 사용자 에이전트
   * @returns 저장된 rrweb event
   */
  async saveEvent({
    sessionId,
    packedEventData,
    jiraProjectKey,
    userAgent,
  }: {
    sessionId: string;
    packedEventData: string;
    jiraProjectKey: string;
    userAgent: string;
  }): Promise<SessionEvent> {
    const event = await this.prisma.sessionEvent.create({
      data: {
        sessionId,
        eventData: packedEventData,
        timestamp: Date.now(),
      },
    });

    // 패킷 저장 후 외부 API 호출 (비동기, 실패해도 저장은 성공)
    this.notifyExternalServices({
      eventId: event.id,
      jiraProjectKey,
      userAgent,
    }).catch((error) => {
      this.logger.error(
        `saveEvent: 외부 서비스 알림 실패 (이벤트ID: ${event.id}):`,
        error.stack
      );
    });

    return event;
  }

  /**
   * 외부 서비스에 알림 전송 (Slack, Jira)
   * @param eventId - 이벤트 ID
   * @param eventCount - 저장된 이벤트 개수
   */
  private async notifyExternalServices({
    eventId,
    jiraProjectKey,
    userAgent,
  }: {
    eventId: number;
    jiraProjectKey: string;
    userAgent: string;
  }): Promise<void> {
    const jiraTicketLink = await this.jiraService
      .createTicket(eventId, jiraProjectKey, userAgent)
      .catch((error) => {
        this.logger.warn(`Jira 티켓 생성 실패: ${error.message}`);
      });
    const remoteDebugViewerUrl = process.env.REMOTE_DEBUG_VIEWER_URL;

    if (!remoteDebugViewerUrl) {
      this.logger.warn(
        "REMOTE_DEBUG_VIEWER_URL 환경변수가 설정되지 않았습니다"
      );
      return;
    }
    const viewerLink = `${remoteDebugViewerUrl}/viewer?eventId=${eventId}`;
    const slackMessage = `이벤트 생성 완료! 지라티켓:${jiraTicketLink}, \n 재생링크: ${viewerLink}`;

    this.slackService
      .sendNotification({
        message: slackMessage,
        eventId,
      })
      .catch((error) => {
        this.logger.warn(`Slack 알림 실패: ${error.message}`);
      });
  }

  /**
   * eventId 기반 event 조회
   * @param eventId - Event ID
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
   * id 기반 event 삭제
   * @param id - Event ID
   * @returns 삭제된 event
   */
  async deleteEventById(eventId: number): Promise<SessionEvent> {
    try {
      return await this.prisma.sessionEvent.delete({
        where: { id: Number(eventId) },
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
  }
}
