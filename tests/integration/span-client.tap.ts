// TODO: placeholder until we focus on full implementation

import test from 'tape'
import uuidv4 from 'uuid/v4'

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
  t.ok(spanConfig.apiKey, 'TEST_API_KEY must be configured for tests')

  t.test('Should send batch of individually added spans', (t): void => {
    const traceId = Date.now().toString()

    const attributes = {
      'name': 'commonName',
      'service.name': 'node-sdk-test-entity'
    }

    const batch = new SpanBatch(attributes)

    const span1: Span = {
      'id': uuidv4(),
      'trace.id': traceId,
      'timestamp': Date.now(),
      'attributes': {
        'name': 'firstTest',
        'service.name': 'node-sdk-test-entity',
        'duration.ms': 10,
      }
    }

    const span2: Span = {
      'id': uuidv4(),
      'trace.id': traceId,
      'timestamp': Date.now(),
      'attributes': {
        'name': 'firstTest',
        'duration.ms': 10,
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

  t.test('should send batch from span interface', (t): void => {
    const batch = new SpanBatch()

    const span1: Span = {
      'id': uuidv4(),
      'trace.id': Date.now().toString(),
      'timestamp': Date.now(),
      'attributes': {
        'name': 'interface-test',
        'service.name': 'node-sdk-test-entity',
        'duration.ms': 10,
      }
    }

    batch.addSpan(span1)

    const client = new SpanClient(spanConfig)
    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)
      t.end()
    })
  })

  t.test('should send custom attributes', (t): void => {
    const batch = new SpanBatch()
    const attributes = {
      'host': 'twinkies',
      'service.name': 'node-sdk-test-entity'
    }

    const span = new Span(uuidv4(), 'tracer100', Date.now(),
      'name', 'parentId', 'node-sdk-test-entity', 10,
      attributes)

    batch.addSpan(span)

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
