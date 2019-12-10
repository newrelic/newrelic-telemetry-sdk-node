import test from 'tape'
import uuidv4 from 'uuid/v4'

import {
  SummaryMetric,
  MetricBatch,
  Metric
} from '../../src/client/metrics'

import {
  Span,
  SpanBatch,
} from '../../src/client/spans'

class MockMetricBatch extends MetricBatch {
  public mockGetMetrics(): Metric[] {
    return this.metrics
  }

  public mockGetLimit(): number {
    return this.LIMIT
  }
}

class MockSpanBatch extends SpanBatch {
  public mockGetSpans(): Span[] {
    return this.spans
  }

  public mockGetLimit(): number {
    return this.LIMIT
  }
}

test('test limits on batches', (t): void => {
  t.test('test metric limits', (t): void => {
    const batch = new MockMetricBatch
    t.ok(0 === batch.mockGetMetrics().length, 'new batch is empty')

    // get a big'old array of metrics for us to reuse
    let hugeMetrics: SummaryMetric[] = []
    while (hugeMetrics.length < batch.mockGetLimit() + 10) {
      hugeMetrics.push(new SummaryMetric('foo'))
    }

    // populate our first batch with too many metrics
    for (const idMetrics of hugeMetrics.entries()) {
      batch.addMetric(idMetrics[1])
    }

    t.ok(
      batch.mockGetLimit() === batch.mockGetMetrics().length,
      'batch did not collect too many metrics'
    )

    // try creating a new batch with too many metrics
    const batch2 = new MockMetricBatch({ test: true }, Date.now(), 1000, hugeMetrics)
    t.ok(
      batch2.mockGetLimit() === batch2.mockGetMetrics().length,
      'batch did not keep too large metrics array'
    )
    t.end()
  })

  t.test('test span limits', (t): void => {
    const batch = new MockSpanBatch
    t.ok(0 === batch.mockGetSpans().length, 'new batch is empty')

    // get a big'old array of metrics for us to reuse
    let hugeSpans: Span[] = []
    while (hugeSpans.length < batch.mockGetLimit() + 10) {
      hugeSpans.push({
        'id': uuidv4(),
        'trace.id': 'abc123',
        'timestamp': Date.now(),
        'attributes': {
          'name': 'firstTest',
          'service.name': 'node-sdk-test-entity',
          'duration.ms': 10,
        }
      })
    }

    // populate our first batch with too many spans
    for (const idSpans of hugeSpans.entries()) {
      batch.addSpan(idSpans[1])
    }

    t.ok(
      batch.mockGetLimit() === batch.mockGetSpans().length,
      'batch did not collect too many spans'
    )

    // try creating a new batch with too many metrics
    const batch2 = new MockSpanBatch({}, hugeSpans)
    t.ok(
      batch2.mockGetLimit() === batch2.mockGetSpans().length,
      'batch did not keep too large span array'
    )
    t.end()
  })

  t.end()
})
