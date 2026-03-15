export function logInfo(endpoint: string, data?: object): void {
  console.info(JSON.stringify({
    level: "info",
    endpoint,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}

export function logWarn(endpoint: string, data?: object): void {
  console.warn(JSON.stringify({
    level: "warn",
    endpoint,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}

export function logError(endpoint: string, error: unknown, data?: object): void {
  console.error(JSON.stringify({
    level: "error",
    endpoint,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    ...data,
  }));
}
