import test from 'tape'
import nock from 'nock'

import {
  recommendedStrategyHandler,
  createRecommendedStrategyHandler,
  metrics,
  RecommendedAction,
  RecommendedStrategyOptions
} from '../../src/client'

const FAKE_HOST = 'fakehost.newrelic.com'
const METRIC_PATH = '/metric/v1'

test('Should handle success cases', (t): void => {
  for (let i = 200; i < 300; i++) {
    t.test(`Should be success on ${i} status code`, createSuccessTest(i))
  }

  function createSuccessTest(statusCode: number): test.TestCase {
    return successTestCase

    function successTestCase(t: test.Test): void {
      nock.disableNetConnect()

      mockEndpoint(METRIC_PATH).reply(statusCode)
      const metricClient = createMetricClient()

      const batch = new metrics.MetricBatch()
      batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

      const handler = createRecommendedStrategyHandler(null, assertSuccess)
      metricClient.send(batch, handler)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.equal(
          finalAction,
          RecommendedAction.Success,
          `Should have ended with Success but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    }
  }
})

test('Should drop data on 400', (t): void => {
  const dropCodes = [400, 401, 403, 404, 405, 409, 410, 411]

  dropCodes.forEach((statusCode): void => {
    t.test(`Should drop data on ${statusCode} status code`, createDiscardTest(statusCode))
  })

  function createDiscardTest(statusCode: number): test.TestCase {
    return discardTestCase

    function discardTestCase(t: test.Test): void {
      nock.disableNetConnect()

      mockEndpoint(METRIC_PATH).reply(statusCode)
      const metricClient = createMetricClient()

      const batch = new metrics.MetricBatch()
      batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

      const handler = createRecommendedStrategyHandler(null, assertSuccess)
      metricClient.send(batch, handler)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    }
  }
})

test('Should retry on 408', (t): void => {
  t.test('Should return Success on 202 retry', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(408)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')
      const retryEndpoint = mockEndpoint(METRIC_PATH).reply(202)

      recommendedStrategyHandler(err, res, body, requestData, null, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint.isDone(), 'Should have made retry request.')

        t.equal(
          finalAction,
          RecommendedAction.Success,
          `Should have ended with Success but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should return Discard on 404 retry', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(408)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')
      const retryEndpoint = mockEndpoint(METRIC_PATH).reply(404)

      recommendedStrategyHandler(err, res, body, requestData, null, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint.isDone(), 'Should have made retry request.')

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should retry on 404 retry, Success on 200 retry', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(408)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')
      const retryEndpoint = mockEndpoint(METRIC_PATH).reply(408)
      const successEndpoint = mockEndpoint(METRIC_PATH).reply(200)

      recommendedStrategyHandler(err, res, body, requestData, null, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint.isDone(), 'Should have made first retry request.')
        t.ok(successEndpoint.isDone(), 'Should have made second retry request.')

        t.equal(
          finalAction,
          RecommendedAction.Success,
          `Should have ended with Success but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should return Discard on max retries', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(408)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')

      // Mock each intead of persist so any extra tries would error
      const retryEndpoint1 = mockEndpoint(METRIC_PATH).reply(408)
      const retryEndpoint2 = mockEndpoint(METRIC_PATH).reply(408)
      const retryEndpoint3 = mockEndpoint(METRIC_PATH).reply(408)

      // constrain things a bit so test runs faster
      const options: RecommendedStrategyOptions = {
        maxRetries: 3
      }

      recommendedStrategyHandler(err, res, body, requestData, options, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint1.isDone(), 'Should have made retry request 1.')
        t.ok(retryEndpoint2.isDone(), 'Should have made retry request 2.')
        t.ok(retryEndpoint3.isDone(), 'Should have made retry request 3.')

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })
})

test('Should split and retry on 413', (t): void => {
  t.test('Should return Success when both succeed', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(413)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric1', type: metrics.MetricType.Count, value: 2})
    batch.addMetric({name: 'MyMetric2', type: metrics.MetricType.Count, value: 4})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')
      const retryEndpoint1 = mockEndpoint(METRIC_PATH).reply(200)
      const retryEndpoint2 = mockEndpoint(METRIC_PATH).reply(200)

      recommendedStrategyHandler(err, res, body, requestData, null, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint1.isDone(), 'Should have made retry request for first half.')
        t.ok(retryEndpoint2.isDone(), 'Should have made retry request for second half.')

        t.equal(
          finalAction,
          RecommendedAction.Success,
          `Should have ended with Success but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should return discard when both discard', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(413)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric1', type: metrics.MetricType.Count, value: 2})
    batch.addMetric({name: 'MyMetric2', type: metrics.MetricType.Count, value: 4})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')
      const retryEndpoint1 = mockEndpoint(METRIC_PATH).reply(400)
      const retryEndpoint2 = mockEndpoint(METRIC_PATH).reply(404)

      recommendedStrategyHandler(err, res, body, requestData, null, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint1.isDone(), 'Should have made retry request for first half.')
        t.ok(retryEndpoint2.isDone(), 'Should have made retry request for second half.')

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should return last seen error, when both error', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(413)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric1', type: metrics.MetricType.Count, value: 2})
    batch.addMetric({name: 'MyMetric2', type: metrics.MetricType.Count, value: 4})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')

      // Only let retry network error once
      const options: RecommendedStrategyOptions = {
        maxRetries: 1
      }

      recommendedStrategyHandler(err, res, body, requestData, options, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.ok(finalError)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nockError = finalError as any
        t.equal(nockError.statusCode, 404, 'Should be 404 error from nock.')

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should return error when one errors', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(413)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric1', type: metrics.MetricType.Count, value: 2})
    batch.addMetric({name: 'MyMetric2', type: metrics.MetricType.Count, value: 4})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')
      const retryEndpoint1 = mockEndpoint(METRIC_PATH).reply(202)

      // Only let retry network error once
      const options: RecommendedStrategyOptions = {
        maxRetries: 1
      }

      recommendedStrategyHandler(err, res, body, requestData, options, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.ok(retryEndpoint1.isDone(), 'Should hade retry request for a half.')

        t.ok(finalError)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nockError = finalError as any
        t.equal(nockError.statusCode, 404, 'Should be 404 error from nock.')

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should return Discard on max retries', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(413)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric1', type: metrics.MetricType.Count, value: 2})
    batch.addMetric({name: 'MyMetric2', type: metrics.MetricType.Count, value: 4})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')

      // Mock each intead of persist so any extra tries would error.
      // Each original split path will get 3 requests (since data can't be split further)
      // for a total of 3 retry attempts per.
      const retryEndpoint1 = mockEndpoint(METRIC_PATH).reply(413)
      const retryEndpoint2 = mockEndpoint(METRIC_PATH).reply(413)
      const retryEndpoint3 = mockEndpoint(METRIC_PATH).reply(413)
      const retryEndpoint4 = mockEndpoint(METRIC_PATH).reply(413)
      const retryEndpoint5 = mockEndpoint(METRIC_PATH).reply(413)
      const retryEndpoint6 = mockEndpoint(METRIC_PATH).reply(413)

      const options: RecommendedStrategyOptions = {
        maxRetries: 3
      }

      recommendedStrategyHandler(err, res, body, requestData, options, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint1.isDone(), 'Should hade retry request for a half.')
        t.ok(retryEndpoint2.isDone(), 'Should hade retry request for a half.')
        t.ok(retryEndpoint3.isDone(), 'Should hade retry request for a half.')
        t.ok(retryEndpoint4.isDone(), 'Should hade retry request for a half.')
        t.ok(retryEndpoint5.isDone(), 'Should hade retry request for a half.')
        t.ok(retryEndpoint6.isDone(), 'Should hade retry request for a half.')

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })
})

test('Should retry-after on 429', (t): void => {
  t.test('Should return Discard on 404 retry', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH)
      .reply(429)
      .defaultReplyHeaders({'retry-after': '2'})

    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')
      const retryEndpoint = mockEndpoint(METRIC_PATH).reply(404)

      recommendedStrategyHandler(err, res, body, requestData, null, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint.isDone(), 'Should have made retry request.')

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should return Success on 202 retry', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH)
      .reply(429)
      .defaultReplyHeaders({'retry-after': '2'})

    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')
      const retryEndpoint = mockEndpoint(METRIC_PATH).reply(202)

      recommendedStrategyHandler(err, res, body, requestData, null, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint.isDone(), 'Should have made retry request.')

        t.equal(
          finalAction,
          RecommendedAction.Success,
          `Should have ended with Success but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should return Discard on max retries', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH)
      .reply(429)
      .defaultReplyHeaders({'retry-after': '1'})

    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')

      // Mock each intead of persist so any extra tries would error
      const retryEndpoint1 = mockEndpoint(METRIC_PATH)
        .reply(429)
        .defaultReplyHeaders({'retry-after': '2'})
      const retryEndpoint2 = mockEndpoint(METRIC_PATH)
        .reply(429)
        .defaultReplyHeaders({'retry-after': '2'})
      const retryEndpoint3 = mockEndpoint(METRIC_PATH)
        .reply(429)
        .defaultReplyHeaders({'retry-after': '2'})

      // constrain things a bit so test runs faster
      const options: RecommendedStrategyOptions = {
        maxRetries: 3
      }

      recommendedStrategyHandler(err, res, body, requestData, options, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint1.isDone(), 'Should have made retry request 1.')
        t.ok(retryEndpoint2.isDone(), 'Should have made retry request 2.')
        t.ok(retryEndpoint3.isDone(), 'Should have made retry request 3.')

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })
})

test('Should backoff-retry on 300', (t): void => {
  t.test('Should return Discard on 400 retry', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(300)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')
      const retryEndpoint1 = mockEndpoint(METRIC_PATH).reply(300)
      const retryEndpoint2 = mockEndpoint(METRIC_PATH).reply(300)
      const retryEndpoint3 = mockEndpoint(METRIC_PATH).reply(400)

      recommendedStrategyHandler(err, res, body, requestData, null, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint1.isDone(), 'Should have made retry request 1.')
        t.ok(retryEndpoint2.isDone(), 'Should have made retry request 2.')
        t.ok(retryEndpoint3.isDone(), 'Should have made retry request 3.')

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should return Success on 202 retry', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(300)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')
      const retryEndpoint1 = mockEndpoint(METRIC_PATH).reply(300)
      const retryEndpoint2 = mockEndpoint(METRIC_PATH).reply(300)
      const retryEndpoint3 = mockEndpoint(METRIC_PATH).reply(202)

      recommendedStrategyHandler(err, res, body, requestData, null, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint1.isDone(), 'Should have made retry request 1.')
        t.ok(retryEndpoint2.isDone(), 'Should have made retry request 2.')
        t.ok(retryEndpoint3.isDone(), 'Should have made retry request 3.')

        t.equal(
          finalAction,
          RecommendedAction.Success,
          `Should have ended with Success but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })

  t.test('Should return Discard on max retries', (t): void => {
    nock.disableNetConnect()

    const initialEndpoint = mockEndpoint(METRIC_PATH).reply(300)
    const metricClient = createMetricClient()

    const batch = new metrics.MetricBatch()
    batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

    metricClient.send(batch, (err, res, body, requestData): void => {
      t.error(err)

      t.ok(initialEndpoint.isDone(), 'Should have made initial request.')

      // Mock each intead of persist so any extra tries would error
      const retryEndpoint1 = mockEndpoint(METRIC_PATH).reply(300)
      const retryEndpoint2 = mockEndpoint(METRIC_PATH).reply(300)
      const retryEndpoint3 = mockEndpoint(METRIC_PATH).reply(300)
      const retryEndpoint4 = mockEndpoint(METRIC_PATH).reply(300)
      const retryEndpoint5 = mockEndpoint(METRIC_PATH).reply(300)

      // constrain things a bit so test runs faster
      const options: RecommendedStrategyOptions = {
        retryFactor: 1,
        maxRetries: 5,
        backoffMaxInterval: 2
      }

      recommendedStrategyHandler(err, res, body, requestData, options, assertSuccess)

      function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
        t.error(finalError)

        t.ok(retryEndpoint1.isDone(), 'Should have made retry request 1.')
        t.ok(retryEndpoint2.isDone(), 'Should have made retry request 2.')
        t.ok(retryEndpoint3.isDone(), 'Should have made retry request 3.')
        t.ok(retryEndpoint4.isDone(), 'Should have made retry request 4.')
        t.ok(retryEndpoint5.isDone(), 'Should have made retry request 5.')

        t.equal(
          finalAction,
          RecommendedAction.Discard,
          `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
        )

        tearDown()
        t.end()
      }
    })
  })
})

test('Should return Discard on max retries across retry types', (t): void => {
  nock.disableNetConnect()

  const initialBackoffEndpoint = mockEndpoint(METRIC_PATH).reply(300)
  const metricClient = createMetricClient()

  const batch = new metrics.MetricBatch()
  batch.addMetric({name: 'MyMetric', type: metrics.MetricType.Count, value: 2})

  metricClient.send(batch, (err, res, body, requestData): void => {
    t.error(err)

    t.ok(initialBackoffEndpoint.isDone(), 'Should have made initial request.')

    // Mock each intead of persist so any extra tries would error
    const retryAfterEndpoint = mockEndpoint(METRIC_PATH)
      .reply(429)
      .defaultReplyHeaders({'retry-after': '2'})

    // Only one piece of data so won't be able to split, will be 1 request
    const splitRetryEndpoint = mockEndpoint(METRIC_PATH).reply(413)
    const retryEndpoint3 = mockEndpoint(METRIC_PATH).reply(408)

    // constrain things a bit so test runs faster
    const options: RecommendedStrategyOptions = {
      maxRetries: 3
    }

    recommendedStrategyHandler(err, res, body, requestData, options, assertSuccess)

    function assertSuccess(finalError: Error, finalAction: RecommendedAction): void {
      t.error(finalError)

      t.ok(retryAfterEndpoint.isDone(), 'Should have made retry request 1.')
      t.ok(splitRetryEndpoint.isDone(), 'Should have made retry request 2.')
      t.ok(retryEndpoint3.isDone(), 'Should have made retry request 3.')

      t.equal(
        finalAction,
        RecommendedAction.Discard,
        `Should have ended with Discard but got ${RecommendedAction[finalAction]}`
      )

      tearDown()
      t.end()
    }
  })
})

function mockEndpoint(path: string): nock.Interceptor {
  return nock(`https://${FAKE_HOST}`).post(path)
}

function createMetricClient(): metrics.MetricClient {
  const options: metrics.MetricClientOptions = {
    apiKey: 'some key',
    host: FAKE_HOST
  }

  const metricClient = new metrics.MetricClient(options)
  return metricClient
}

function tearDown(): void {
  if (!nock.isDone()) {
    // eslint-disable-next-line no-console
    console.error('Cleaning pending mocks: %j', nock.pendingMocks())
    nock.cleanAll()
  }

  nock.enableNetConnect()
}
