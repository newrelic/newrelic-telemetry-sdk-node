import { Span, SpanData } from './span'
import { AttributeMap } from '../attributeMap'

interface CommonSpanData {
  attributes?: AttributeMap
}

// TODO: Consider ability to send SpanBatch purely via interface. Would
// export in that case.
// TODO: Rename to avoid 'payload'. Find clear wording between interface
// and class.
interface SpanBatchPayload {
  spans?: SpanData[]
  common?: CommonSpanData
}

export class SpanBatch implements SpanBatchPayload {
  public common?: CommonSpanData
  public spans: Span[]

  public constructor(
    attributes?: AttributeMap,
    spans?: SpanData[]
  ) {
    if (attributes) {
      const common: CommonSpanData = {}

      common.attributes = attributes
      this.common = common
    }

    this.spans = spans || []
  }

  public addSpan(...spans: Span[]): SpanBatch {
    this.spans.push(...spans)
    return this
  }
}
