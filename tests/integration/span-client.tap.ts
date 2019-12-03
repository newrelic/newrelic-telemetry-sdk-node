// TODO: placeholder until we focus on full implementation

import test from 'tape'

import {
  SpanClient,
  SpanClientOptions,
  SpanBatch,
  Span
} from '../../src/client/spans'

const spanConfig: SpanClientOptions = {
  licenseKey: process.env.TEST_LICENSE_KEY,
  host: process.env.TEST_SPAN_HOST || 'staging-collector.newrelic.com'
}

test('Span Client Integration Tests', (t): void => {
  t.ok(spanConfig.licenseKey, 'TEST_LICENSE_KEY must be configured for tests')

  t.test('Should send batch of individually added spans', (t): void => {
    const traceId = Date.now().toString()

    const batch = new SpanBatch()

    const span1: Span = {
      guid: Date.now().toString(), // TODO: Generate real GUID
      name: 'firstTest',
      entityName: 'test-entity',
      traceId: traceId,
      timestamp: Date.now(),
      durationMs: 10,
    }

    const span2: Span = {
      guid: Date.now().toString(),
      name: 'childTest',
      entityName: 'test-entity',
      traceId: traceId,
      timestamp: Date.now(),
      durationMs: 10,
      parentId: span1.guid
    }

    batch.addSpan(span1)
    batch.addSpan(span2)

    const client = new SpanClient(spanConfig)

    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 200)
      t.end()
    })
  })
})
