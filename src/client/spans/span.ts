
export interface Span {
  guid: string
  name: string
  entityName: string
  traceId: string
  timestamp: number
  durationMs: number
  tags?: {[key: string]: string | boolean | number}
  parentId?: string
}
