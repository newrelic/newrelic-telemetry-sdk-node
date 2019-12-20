/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LoggerFunction {
  (message: string, ...args: any[]): void
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export interface Logger {
  error: LoggerFunction
  info: LoggerFunction
  debug: LoggerFunction
}

const _noOp = (): void => {}

export class NoOpLogger implements Logger {
  public error = _noOp
  public info = _noOp
  public debug = _noOp
}
