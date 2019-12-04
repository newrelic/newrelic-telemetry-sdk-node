// TODO: placeholder until we focus on full implementation

import test from 'tape'

import {
  SpanClient,
  SpanClientOptions,
  SpanBatch,
  Span
} from '../../src/client/spans'

const spanConfig: SpanClientOptions = {
  apiKey: process.env.TEST_API_KEY,
  host: process.env.TEST_SPAN_HOST || 'staging-trace-api.newrelic.com'
}

test('Span Client Integration Tests', (t): void => {
  t.ok(spanConfig.apiKey, 'TEST_LICENSE_KEY must be configured for tests')

  t.test('Should send batch of individually added spans', (t): void => {
    const traceId = Date.now().toString()

    const batch = new SpanBatch()

    const span1: Span = {
      id: Date.now().toString(), // TODO: Generate real GUID
      'trace.id': traceId,
      timestamp: Date.now(),
      attributes: {
        name: 'firstTest',
        'service.name': 'node-sdk-test-entity',
        'duration.ms': 10,
      }
    }

    const span2: Span = {
      id: Date.now().toString(),
      'trace.id': traceId,
      timestamp: Date.now(),
      attributes: {
        name: 'childTest',
        'service.name': 'node-sdk-test-entity',
        'duration.ms': 10,
        'parent.id': span1.id
      }
    }

    batch.addSpan(span1)
    batch.addSpan(span2)

    const client = new SpanClient(spanConfig)

    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)
      t.end()
    })
  })
})
