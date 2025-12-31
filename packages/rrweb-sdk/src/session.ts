/**
 * Generate a unique session ID
 * Format: session_{timestamp}_{random}
 * Matches existing pattern from SampleComponent
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${random}`;
}
