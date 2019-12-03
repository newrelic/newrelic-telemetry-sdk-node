import { Span } from './span'

// TODO: Consider ability to send SpanBatch purely via interface. Would
// export in that case.
// TODO: Rename to avoid 'payload'. Find clear wording between interface
// and class.
interface SpanBatchPayload {
  spans: Span[]
}

export class SpanBatch implements SpanBatchPayload {
  public spans: Span[]

  public constructor(spans: Span[] = []) {
    this.spans = spans
  }

  public addSpan(...spans: Span[]): SpanBatch {
    this.spans.push(...spans)
    return this
  }
}
