import { AttributeMap } from '../attributeMap'

export interface SpanAttributeMap {
  'duration.ms'?: number
  name?: string
  'parent.id'?: string
  'service.name'?: string
  host?: string
}

export interface SpanData {
  id: string
  'trace.id': string
  timestamp: number
  attributes?: SpanAttributeMap | AttributeMap
}

export class Span implements SpanData {
  public id: string
  public 'trace.id': string
  public timestamp: number
  public attributes?: SpanAttributeMap | AttributeMap

  public constructor(
    id: string,
    traceId: string,
    timestamp: number,
    attributes?: SpanAttributeMap | AttributeMap
  ) {
    this.id = id
    this['trace.id'] = traceId
    this.timestamp = timestamp
    this.attributes = attributes
  }
}
