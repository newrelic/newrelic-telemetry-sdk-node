import { AttributeMap } from '../attributeMap'

export interface EventData {
  eventType: string
  attributes?: AttributeMap
  timestamp?: number
}

export class Event implements EventData {
  public eventType: string
  public attributes?: AttributeMap
  public timestamp?: number

  public constructor(eventType: string, attributes?: AttributeMap, timestamp?: number) {
    this.eventType = eventType
    this.attributes = attributes || {}
    this.timestamp = timestamp
  }
}
