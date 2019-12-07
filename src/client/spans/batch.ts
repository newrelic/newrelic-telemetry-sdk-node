import { Span } from './span'

// TODO: Consider ability to send SpanBatch purely via interface. Would
// export in that case.
// TODO: Rename to avoid 'payload'. Find clear wording between interface
// and class.
interface SpanBatchPayload {
  spans: Span[]
}

export class SpanBatch implements SpanBatchPayload {
  protected readonly LIMIT = 2000
  public spans: Span[]

  public constructor(spans: Span[] = []) {
    this.spans = spans

    // if the client programmer passed us an array that's
    // too big, keep the first `this.LIMIT` items and
    // then use addSpan to add the rest (making the later
    // items subject to the adaptive sampling)
    if (this.spans.length > this.LIMIT) {
      const remnant = this.spans.splice(this.LIMIT)
      this.addSpan(...remnant)
    }
  }

  public addSpan(...spans: Span[]): SpanBatch {
    this.spans.push(...spans)

    // keep spans array at its limited value
    while (this.LIMIT < this.spans.length) {
      this.spans.splice(this.getRandomInt(0, this.LIMIT - 1), 1)
    }
    return this
  }

  // get a random number between min and max, inclusive
  protected getRandomInt(min: number, max: number): number {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(
      Math.random() * ((max + 1) - min)
    ) + min
  }
}
