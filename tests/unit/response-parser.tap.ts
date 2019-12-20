import test from 'tape'
import { IncomingMessage } from 'http'
import { Socket } from 'net'

import { parseResponse, RecommendedAction, RequestResponseError } from '../../src/telemetry'

test('parseResponse()', (t): void => {
  t.test('Should return Success for 200 status codes', (t): void => {
    for (let i = 200; i < 300; i++) {
      verifyParsedResponse(t, i, RecommendedAction.Success)
    }

    t.end()
  })

  t.test('Should return Discard for specific status codes', (t): void => {
    const dropCodes = [400, 401, 403, 404, 405, 409, 410, 411]

    dropCodes.forEach((statusCode): void => {
      verifyParsedResponse(t, statusCode, RecommendedAction.Discard)
    })

    t.end()
  })

  t.test('Should return Retry for 408 status codes', (t): void => {
    verifyParsedResponse(t, 408, RecommendedAction.Retry)
    t.end()
  })

  t.test('Should return SplitRetry for 413 status codes', (t): void => {
    verifyParsedResponse(t, 413, RecommendedAction.SplitRetry)
    t.end()
  })

  t.test('Should return RetryAfter for 429 status codes', (t): void => {
    const expectedRetry = 10000

    const response = createResponse(429)
    response.headers['retry-after'] = (expectedRetry / 1000).toString()

    const parsedResponse = parseResponse(null, response)

    t.equal(
      parsedResponse.recommendedAction,
      RecommendedAction.RetryAfter,
      'Status code 429 should result in RetryAfter'
    )

    t.equal(parsedResponse.retryAfterMs, expectedRetry)

    t.end()
  })

  t.test('Should return Backoff for unknown status codes', (t): void => {
    const unknownCodes = [300, 402, 500]
    unknownCodes.forEach((statusCode): void => {
      verifyParsedResponse(t, statusCode, RecommendedAction.Backoff)
    })

    t.end()
  })

  t.test('Should return Discard for unexpected app error', (t): void => {
    const error = new Error()

    const parsedResponse = parseResponse(error, null)

    t.equal(parsedResponse.error, error)

    t.equal(
      parsedResponse.recommendedAction,
      RecommendedAction.Discard,
      'Unexpected error should result in Discard'
    )

    t.end()
  })

  t.test('Should return Backoff for network error and inner error', (t): void => {
    const innerError = new Error('Inner Fail')
    const outerError = new RequestResponseError('Outer Fail', innerError)

    const parsedResponse = parseResponse(outerError, null)

    t.equal(parsedResponse.error, innerError)

    t.equal(
      parsedResponse.recommendedAction,
      RecommendedAction.Backoff,
      'Network error should result in Backoff'
    )

    t.end()
  })
})

function verifyParsedResponse(
  t: test.Test,
  statusCode: number,
  recommendedAction: RecommendedAction
): void {
  const response = createResponse(statusCode)

  const parsedResponse = parseResponse(null, response)
  t.equal(
    parsedResponse.recommendedAction,
    recommendedAction,
    `Status code ${statusCode} should result in ${RecommendedAction[recommendedAction]}`
  )

  t.notOk(parsedResponse.error)
}

function createResponse(statusCode: number): IncomingMessage {
  const response = new IncomingMessage(new Socket())
  response.statusCode = statusCode

  return response
}
