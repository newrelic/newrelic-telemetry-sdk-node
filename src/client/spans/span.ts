export interface Attributes {
  'duration.ms'?: number
  name?: string
  'parent.id'?: string
  'service.name'?: string
}

export interface Span {
  id: string
  'trace.id': string
  timestamp: number
  attributes?: Attributes
}
