/**
 * Minimal structured logger so this example stays dependency-free.
 * Swap in pino, or your own logger, in production.
 */
type Fields = Record<string, unknown>;

function emit(level: string, message: string, fields?: Fields): void {
  const suffix =
    fields && Object.keys(fields).length > 0 ? ` ${JSON.stringify(fields)}` : "";
  console.log(`${level} ${message}${suffix}`);
}

export const log = {
  info: (message: string, fields?: Fields) => emit("info", message, fields),
  warn: (message: string, fields?: Fields) => emit("warn", message, fields),
  error: (message: string, fields?: Fields) => emit("error", message, fields),
};
