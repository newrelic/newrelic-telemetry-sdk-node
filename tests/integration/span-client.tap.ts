import test from 'tape'
import uuidv4 from 'uuid/v4'
import nock from 'nock'
import zlib from 'zlib'
import { IncomingMessage } from 'http'

import {
  SpanClient,
  SpanClientOptions,
  SpanBatch,
  Span
} from '../../src/telemetry/spans'

const FAKE_API_KEY = 'api key'
const FAKE_HOST = 'test-host.newrelic.com'
const SPAN_PATH = '/trace/v1'

const spanConfig: SpanClientOptions = {
  apiKey: FAKE_API_KEY,
  host: FAKE_HOST
}

test('Span Client - Server Integration Tests', (t): void => {
  let rawRequestBody: string = null

  function nockRequestHost(): void {
    nock.disableNetConnect()

    nock(`https://${FAKE_HOST}`).post(SPAN_PATH, (body): boolean => {
      rawRequestBody = body
      return true
    }).reply(202, { requestId: 'some id' })
  }

  t.test('Should send batch of individually added spans', (t): void => {
    nockRequestHost()

    const traceId = Date.now().toString()

    const expectedCommonAttributes = {
      'name': 'commonName',
      'service.name': 'node-sdk-test-entity'
    }

    const batch = new SpanBatch(expectedCommonAttributes)

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

    client.send(batch, verifySend)

    function verifySend(err: Error, res: IncomingMessage, body: string): void {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)

      t.ok(rawRequestBody)

      decodeRequestBody(rawRequestBody, (decodeError, data): void => {
        t.error(decodeError)

        const { common, spans } = data[0] as SpanBatch

        t.deepEqual(common.attributes, expectedCommonAttributes)

        const [firstSpan, secondSpan] = spans
        t.deepEqual(firstSpan, span1)
        t.deepEqual(secondSpan, span2)

        cleanupNock()
        t.end()
      })
    }
  })

  t.test('should send batch from span interface', (t): void => {
    nockRequestHost()

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
    client.send(batch, verifySend)

    function verifySend(err: Error, res: IncomingMessage, body: string): void {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)

      t.ok(rawRequestBody)

      decodeRequestBody(rawRequestBody, (decodeError, data): void => {
        t.error(decodeError)

        const { spans } = data[0] as SpanBatch

        const [firstSpan] = spans
        t.deepEqual(firstSpan, span1)

        cleanupNock()
        t.end()
      })
    }
  })

  t.test('should send custom attributes', (t): void => {
    nockRequestHost()

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
    client.send(batch, verifySend)

    function verifySend(err: Error, res: IncomingMessage, body: string): void {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)

      t.ok(rawRequestBody)

      decodeRequestBody(rawRequestBody, (decodeError, data): void => {
        t.error(decodeError)

        const { spans } = data[0] as SpanBatch

        const [firstSpan] = spans
        t.deepEqual(firstSpan, span)

        cleanupNock()
        t.end()
      })
    }
  })
})

function decodeRequestBody(
  encodedData: string, callback:
  (err: Error, data?: object[]) => void
): void {
  // nock stores as hex
  const dataBuffer = Buffer.from(encodedData, 'hex')
  zlib.gunzip(dataBuffer, (err, buff): void => {
    if (err) {
      return callback(err)
    }

    const requestBodyString = buff.toString()
    const requestBody = JSON.parse(requestBodyString)

    callback(null, requestBody)
  })
}

function cleanupNock(): void {
  if (!nock.isDone()) {
    // eslint-disable-next-line no-console
    console.error('Cleaning pending mocks: %j', nock.pendingMocks())
    nock.cleanAll()
  }

  nock.enableNetConnect()
}
