/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LoggerFunction {
  (message: string, ...args: any[]): void
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export interface Logger {
  fatal: LoggerFunction
  error: LoggerFunction
  warn: LoggerFunction
  info: LoggerFunction
  debug: LoggerFunction
  trace: LoggerFunction
}

const _noOp = (): void => {}

export class NoOpLogger implements Logger {
  public fatal = _noOp
  public error = _noOp
  public warn = _noOp
  public info = _noOp
  public debug = _noOp
  public trace = _noOp
}
