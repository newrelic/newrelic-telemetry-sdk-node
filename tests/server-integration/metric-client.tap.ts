import test from 'tape'

import { verifyNrIntegrationErrors, NewRelicFeature } from './insights-results'

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

const metricConfig: MetricClientOptions = {
  apiKey: process.env.TEST_API_KEY,
  host: process.env.TEST_METRIC_HOST
}

test('Metric Client - Server Integration Tests', (t): void => {
  t.ok(metricConfig.apiKey, 'TEST_API_KEY must be configured for tests')

  t.test('Should send batch of individually added summary metrics', (t): void => {
    const batch = new MetricBatch({ test: true }, Date.now(), 1000)

    const summary1 = new SummaryMetric('my-summary-1')
    const summary2 = new SummaryMetric('my-summary-2')

    batch.addMetric(summary1)
    batch.addMetric(summary2)

    const client = new MetricClient(metricConfig)

    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)
      verifyNrIntegrationErrors(t, NewRelicFeature.Metrics, body, t.end)
    })
  })


  t.test('Should send batch from summary metric array', (t): void => {
    const summary1 = new SummaryMetric('my-summary-1')
    const summary2 = new SummaryMetric('my-summary-2')

    const batch = new MetricBatch(
      {test: true},
      Date.now(),
      1000,
      [summary1, summary2]
    )

    const client = new MetricClient(metricConfig)

    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)
      verifyNrIntegrationErrors(t, NewRelicFeature.Metrics, body, t.end)
    })
  })

  t.test('Should send batch from count metric array', (t): void => {
    const count1 = new CountMetric('my-count-1', 2)
    const count2 = new CountMetric('my-count-2', 1)

    const batch = new MetricBatch(
      {test: true},
      Date.now(),
      1000,
      [count1, count2]
    )

    const client = new MetricClient(metricConfig)

    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)
      verifyNrIntegrationErrors(t, NewRelicFeature.Metrics, body, t.end)
    })
  })

  t.test('Should send batch from gauge metric array', (t): void => {
    const gauge1 = new GaugeMetric('my-gauge-1', 1)
    const gauge2 = new GaugeMetric('my-guage-2', 2)

    const batch = new MetricBatch(
      {test: true},
      Date.now(),
      1000,
      [gauge1, gauge2]
    )

    const client = new MetricClient(metricConfig)

    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)
      verifyNrIntegrationErrors(t, NewRelicFeature.Metrics, body, t.end)
    })
  })

  test('Should send batch from metric interface', (t): void => {
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

    const batch = new MetricBatch(
      {test: true},
      Date.now(),
      1000,
      [metric, metric2]
    )

    const client = new MetricClient(metricConfig)

    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)
      verifyNrIntegrationErrors(t, NewRelicFeature.Metrics, body, t.end)
    })
  })
})
