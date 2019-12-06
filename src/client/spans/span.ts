import { AttributeMap } from '../attributeMap'

export interface SpanAttributeMap {
  'duration.ms'?: number
  name?: string
  'parent.id'?: string
  'service.name'?: string
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

  // eslint-disable-next-line max-params
  public constructor(
    id: string,
    traceId: string,
    timestamp: number,
    name?: string,
    parentId?: string,
    serviceName?: string,
    duration?: number
  ) {
    this.id = id
    this['trace.id'] = traceId
    this.timestamp = timestamp

    if (name || parentId || serviceName || duration) {
      this.attributes = {}
      
      if (name) {
        this.attributes.name = name
      }

      if (parentId) {
        this.attributes['parent.id'] = parentId
      }

      if (serviceName) {
        this.attributes['service.name'] = serviceName
      }

      if (duration) {
        this.attributes['duration.ms'] = duration
      }
    }
  }
}
