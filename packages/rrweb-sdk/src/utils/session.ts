/**
 * 유니크한 값의 session id를 생성합니다.
 * Format: session_{timestamp}_{random
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `session_${timestamp}_${random}`;
}
