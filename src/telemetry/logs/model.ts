import {AttributeMap} from '../attributeMap'

interface CommonLogAttrs {
  attributes: AttributeMap
}

interface LogMessage {
  message: string
  timestamp: number
  attributes?: AttributeMap
}

export class Log implements LogMessage {
  public message: string
  public attributes?: AttributeMap
  public timestamp: number

  public constructor(message: string, timestamp?: number, attributes?: AttributeMap) {
    this.message = message
    this.timestamp = timestamp || Date.now()
    this.attributes = attributes
  }
}

export class LogBatch {
  public common?: CommonLogAttrs
  public logs: LogMessage[]

  public constructor(
    logs: LogMessage[],
    attributes?: AttributeMap,
  ) {
    this.logs = logs

    if (attributes) {
      this.common = {
        attributes: attributes
      }
    }
  }

  public append(message: LogMessage): void {
    this.logs.push(message)
  }
}
