const PREFIX = "[RRWeb SDK]";

/**
 * RRWeb SDK 전용 로거
 * 모든 로그에 [RRWeb SDK] prefix를 자동으로 추가합니다.
 */
export const logger = {
  log: (...args: unknown[]) => {
    console.log(PREFIX, ...args);
  },

  warn: (...args: unknown[]) => {
    console.warn(PREFIX, ...args);
  },

  error: (...args: unknown[]) => {
    console.error(PREFIX, ...args);
  },

  info: (...args: unknown[]) => {
    console.info(PREFIX, ...args);
  },

  debug: (...args: unknown[]) => {
    console.debug(PREFIX, ...args);
  },
};
