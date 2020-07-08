import test from 'tape'
import nock from 'nock'
import zlib from 'zlib'
import { IncomingMessage } from 'http'

import {
  MetricClient,
  MetricBatch,
  SummaryMetric,
  CountMetric,
  GaugeMetric,
  Metric,
  MetricType,
  MetricClientOptions
} from '../../src/telemetry/metrics'

const FAKE_API_KEY = 'api key'
const FAKE_HOST = 'test-host.newrelic.com'
const METRIC_PATH = '/metric/v1'

const metricConfig: MetricClientOptions = {
  apiKey: FAKE_API_KEY,
  host: FAKE_HOST
}

test('Metric Client - Integration Tests', (t): void => {
  let rawRequestBody: string = null
  function nockRequestHost(): void {
    nock.disableNetConnect()

    nock(`https://${FAKE_HOST}`).post(METRIC_PATH, (body): boolean => {
      rawRequestBody = body
      return true
    }).reply(202, { requestId: 'some id' })
  }

  t.test('Should send batch of individually added summary metrics', (t): void => {
    nockRequestHost()

    const expectedAttributes = { test: true }
    const expectedInterval = 1000
    const batch = new MetricBatch(expectedAttributes, Date.now(), expectedInterval)

    const summary1 = new SummaryMetric('my-summary-1')
    const summary2 = new SummaryMetric('my-summary-2')

    batch.addMetric(summary1)
    batch.addMetric(summary2)

    const client = new MetricClient(metricConfig)

    client.send(batch, verifySend)

    function verifySend(err: Error, res: IncomingMessage, body: string): void {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)

      t.ok(rawRequestBody)

      decodeRequestBody(rawRequestBody, (decodeError, data): void => {
        t.error(decodeError)

        const { common, metrics} = data[0] as MetricBatch

        t.equal(common['interval.ms'], expectedInterval)
        t.ok(common.timestamp)
        t.deepEqual(common.attributes, expectedAttributes)

        const [firstMetric, secondMetric] = metrics
        t.equal(firstMetric.name, summary1.name)
        t.equal(secondMetric.name, summary2.name)

        cleanupNock()
        t.end()
      })
    }
  })

  t.test('Should send batch from summary metric array', (t): void => {
    nockRequestHost()

    const summary1 = new SummaryMetric('my-summary-1')
    const summary2 = new SummaryMetric('my-summary-2')

    const expectedAttributes = { test: true }
    const expectedInterval = 1000
    const batch = new MetricBatch(
      expectedAttributes,
      Date.now(),
      expectedInterval,
      [summary1, summary2]
    )

    const client = new MetricClient(metricConfig)

    client.send(batch, verifySend)

    function verifySend(err: Error, res: IncomingMessage, body: string): void {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)

      t.ok(rawRequestBody)

      decodeRequestBody(rawRequestBody, (decodeError, data): void => {
        t.error(decodeError)

        const { common, metrics} = data[0] as MetricBatch

        t.equal(common['interval.ms'], expectedInterval)
        t.ok(common.timestamp)
        t.deepEqual(common.attributes, expectedAttributes)

        const [firstMetric, secondMetric] = metrics
        t.equal(firstMetric.name, summary1.name)
        t.equal(secondMetric.name, summary2.name)

        cleanupNock()
        t.end()
      })
    }
  })

  t.test('Should send batch from count metric array', (t): void => {
    nockRequestHost()

    const count1 = new CountMetric('my-count-1', 2)
    const count2 = new CountMetric('my-count-2', 1)

    const expectedAttributes = { test: true }
    const expectedInterval = 1000
    const batch = new MetricBatch(
      expectedAttributes,
      Date.now(),
      expectedInterval,
      [count1, count2]
    )

    const client = new MetricClient(metricConfig)

    client.send(batch, verifySend)

    function verifySend(err: Error, res: IncomingMessage, body: string): void {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)

      t.ok(rawRequestBody)

      decodeRequestBody(rawRequestBody, (decodeError, data): void => {
        t.error(decodeError)

        const { common, metrics} = data[0] as MetricBatch

        t.equal(common['interval.ms'], expectedInterval)
        t.ok(common.timestamp)
        t.deepEqual(common.attributes, expectedAttributes)

        const [firstMetric, secondMetric] = metrics
        t.equal(firstMetric.name, count1.name)
        t.equal(secondMetric.name, count2.name)

        cleanupNock()
        t.end()
      })
    }
  })

  t.test('Should send batch from gauge metric array', (t): void => {
    nockRequestHost()

    const gauge1 = new GaugeMetric('my-gauge-1', 1)
    const gauge2 = new GaugeMetric('my-guage-2', 2)

    const expectedAttributes = { test: true }
    const expectedInterval = 1000
    const batch = new MetricBatch(
      expectedAttributes,
      Date.now(),
      expectedInterval,
      [gauge1, gauge2]
    )

    const client = new MetricClient(metricConfig)

    client.send(batch, verifySend)

    function verifySend(err: Error, res: IncomingMessage, body: string): void {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)

      t.ok(rawRequestBody)

      decodeRequestBody(rawRequestBody, (decodeError, data): void => {
        t.error(decodeError)

        const { common, metrics} = data[0] as MetricBatch

        t.equal(common['interval.ms'], expectedInterval)
        t.ok(common.timestamp)
        t.deepEqual(common.attributes, expectedAttributes)

        const [firstMetric, secondMetric] = metrics
        t.equal(firstMetric.name, gauge1.name)
        t.equal(secondMetric.name, gauge2.name)

        cleanupNock()
        t.end()
      })
    }
  })

  test('Should send batch from metric interface', (t): void => {
    nockRequestHost()

    const metric: Metric = {
      name: 'metric-interface-gauge',
      type: MetricType.Gauge,
      value: 2.0
    }

    // Passing no type will default to gauage on the server
    const metric2: Metric = {
      name: 'metric-interface-auto-gauge',
      value: 3
    }

    const expectedAttributes = { test: true }
    const expectedInterval = 1000
    const batch = new MetricBatch(
      expectedAttributes,
      Date.now(),
      expectedInterval,
      [metric, metric2]
    )

    const client = new MetricClient(metricConfig)

    client.send(batch, verifySend)

    function verifySend(err: Error, res: IncomingMessage, body: string): void {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)

      t.ok(rawRequestBody)

      decodeRequestBody(rawRequestBody, (decodeError, data): void => {
        t.error(decodeError)

        const { common, metrics} = data[0] as MetricBatch

        t.equal(common['interval.ms'], expectedInterval)
        t.ok(common.timestamp)
        t.deepEqual(common.attributes, expectedAttributes)

        const [firstMetric, secondMetric] = metrics
        t.equal(firstMetric.name, metric.name)
        t.equal(secondMetric.name, metric2.name)

        cleanupNock()
        t.end()
      })
    }
  })
})

function cleanupNock(): void {
  if (!nock.isDone()) {
    // eslint-disable-next-line no-console
    console.error('Cleaning pending mocks: %j', nock.pendingMocks())
    nock.cleanAll()
  }

  nock.enableNetConnect()
}

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
