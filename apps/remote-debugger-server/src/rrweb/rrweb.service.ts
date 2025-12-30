import { Injectable, NotFoundException } from "@nestjs/common";
import { SessionEvent } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RrwebService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save a session replay event to the database
   * @param sessionId - Unique session identifier
   * @param eventData - rrweb event data (will be stored as JSONB)
   * @returns Created session event
   */
  async savePackedEvent(
    sessionId: string,
    packedEventData: string,
  ): Promise<SessionEvent> {
    return this.prisma.sessionEvent.create({
      data: {
        sessionId,
        eventData: packedEventData,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Save multiple packed events to the database
   * @param sessionId - Unique session identifier
   * @param packedEvents - Array of packed event data
   * @returns Array of created session events
   */
  async savePackedEvents(
    sessionId: string,
    packedEvents: string[],
  ): Promise<SessionEvent[]> {
    const now = Date.now();
    // Use createManyAndReturn if available (Prisma 5.0+), otherwise use individual creates
    try {
      return await this.prisma.sessionEvent.createManyAndReturn({
        data: packedEvents.map((packedEventData) => ({
          sessionId,
          eventData: packedEventData,
          timestamp: now,
        })),
      });
    } catch {
      // Fallback: create individually if createManyAndReturn is not available
      return Promise.all(
        packedEvents.map((packedEventData) =>
          this.prisma.sessionEvent.create({
            data: {
              sessionId,
              eventData: packedEventData,
              timestamp: now,
            },
          }),
        ),
      );
    }
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
    endTime: number,
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
