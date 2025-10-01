const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
};
