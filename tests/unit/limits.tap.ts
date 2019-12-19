import test from 'tape'
import uuidv4 from 'uuid/v4'

import {
  SummaryMetric,
  MetricBatch
} from '../../src/client/metrics'

import {
  Span,
  SpanBatch,
} from '../../src/client/spans'

import {LIMIT as METRIC_LIMIT} from '../../src/client/metrics/batch'
import {LIMIT as SPAN_LIMIT} from '../../src/client/spans/batch'

test('test limits on batches', (t): void => {
  t.test('test metric limits', (t): void => {
    const batch = new MetricBatch()
    t.equal(batch.metrics.length, 0, 'new batch is empty')

    // get a big'old array of metrics for us to reuse
    let hugeMetrics: SummaryMetric[] = []
    while (hugeMetrics.length < METRIC_LIMIT + 10) {
      hugeMetrics.push(new SummaryMetric('foo'))
    }

    // populate our first batch with too many metrics
    for (const idMetrics of hugeMetrics.entries()) {
      batch.addMetric(idMetrics[1])
    }

    t.equal(batch.metrics.length, METRIC_LIMIT, 'batch did not collect too many metrics')

    // try creating a new batch with too many metrics
    const batch2 = new MetricBatch({ test: true }, Date.now(), 1000, hugeMetrics)

    t.equal(
      batch2.metrics.length,
      METRIC_LIMIT,
      'batch did not keep too large metrics array'
    )

    t.end()
  })

  t.test('test span limits', (t): void => {
    const batch = new SpanBatch()
    t.equal(batch.spans.length, 0, 'new batch is empty')

    // get a big'old array of metrics for us to reuse
    let hugeSpans: Span[] = []
    while (hugeSpans.length < SPAN_LIMIT + 10) {
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

    t.equal(batch.spans.length, SPAN_LIMIT, 'batch did not collect too many spans')

    // try creating a new batch with too many metrics
    const batch2 = new SpanBatch({}, hugeSpans)

    t.equal(batch2.spans.length, SPAN_LIMIT, 'batch did not keep too large span array')
    t.end()
  })

  t.end()
})
