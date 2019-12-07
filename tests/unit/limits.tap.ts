import test from 'tape'
import {
  SummaryMetric,
  MetricBatch,
} from '../../src/client/metrics'

class MockMetricBatch extends MetricBatch {
  public mockGetMetrics() {
    return this.metrics
  }

  public mockGetLimit() {
    return this.LIMIT
  }

}

test('test limits on batches', (t) => {
  t.test('test metric limits', (t) => {
    const batch = new MockMetricBatch;
    t.ok(0 === batch.mockGetMetrics().length, 'new batch is empty')

    // get a big'old array of metrics for us to reuse
    let hugeMetrics: SummaryMetric[] = []
    while(hugeMetrics.length < batch.mockGetLimit() + 10) {
      hugeMetrics.push(new SummaryMetric('foo'))
    }

    //populate our first batch with too many metrics
    for(const idMetrics of hugeMetrics.entries()) {
      batch.addMetric(idMetrics[1])
    }

    t.ok(batch.mockGetLimit() === batch.mockGetMetrics().length, 'batch did not collect too many metrics')

    // try creating a new batch with too many metrics
    const batch2 = new MockMetricBatch({ test: true }, Date.now(), 1000, hugeMetrics)
    console.log("Limit:  " + batch2.mockGetLimit())
    console.log("Length: " +batch2.mockGetMetrics().length)
    t.ok(batch2.mockGetLimit() === batch2.mockGetMetrics().length, 'batch did not keep too large metrics array')
    t.end()
  })

  t.test('test span limits', (t) => {
    t.ok(true, 'test setup')
    t.end()
  })

  t.end()
})
