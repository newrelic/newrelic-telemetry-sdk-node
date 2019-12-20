import { IncomingMessage } from 'http'

import { RequestData, SendCallback } from './base-client'
import { parseResponse, RecommendedAction } from './response-parser'
import { MetricBatch } from './metrics'
import { SpanBatch } from './spans'

const RETRY_FACTOR = 1
const MAX_RETRIES = 10
const BACKOFF_MAX_INTERVAL = 16

interface Callback {
  (finalError?: Error, finalAction?: RecommendedAction): void
}

export type Batch = MetricBatch | SpanBatch

export interface RecommendedStrategyOptions {
  /**
   * Factor in seconds by which retry intervals are calculated.
   * A 408 retry will retry exactly by the value. Backoff retries will
   * exponentially increase time of next backoff using this value as the base.
   * For example: a value of 1 (one second) will retry similar to: [1, 2, 4, 8, 16, ...]
   */
  retryFactor?: number
  /**
   * Maximum number of retries before failing and discarding data.
   * All retries, regardless of type (retry-after, backoff, etc.),
   * will count towards this maximum.
   * For example: a 5 retry maximum when using expontential backoff will retry
   * similar to [1, 2, 4, 8, 16] and then stop retrying and discard data.
   */
  maxRetries?: number
  /**
   * Maximum backoff retry interval in seconds.
   * For example: 1s factor with 16s maximum will
   * retry similar to: [1, 2, 4, 8, 16, 16, 16, ...]
   */
  backoffMaxInterval?: number
}

/**
 * Creates a recommended strategy response handling function for
 * Metric and Span clients that will invoke the provided
 * callback upon completion.
 * @param callback
 */
export function createRecommendedStrategyHandler<T extends Batch>(
  options?: RecommendedStrategyOptions,
  callback?: Callback
): SendCallback<T> {
  return createdRecommendedStrategyHandler

  function createdRecommendedStrategyHandler(
    error: Error,
    response: IncomingMessage,
    body: string,
    requestData: RequestData<T>
  ): void {
    return recommendedStrategyHandler(
      error,
      response,
      body,
      requestData,
      options,
      callback
    )
  }
}

/**
 * Recommended strategy response handling function for Metric and Span clients.
 * Typically based to the callback argument for Metric and Span clients.
 * May be invoked manually.
 * @param error
 * @param response
 * @param body
 * @param requestData
 * @param options Optional options that can be manually provided to the function.
 * @param callback Optional callback that can be manually provided to the function.
 */
// eslint-disable-next-line max-params
export function recommendedStrategyHandler<T extends Batch>(
  error: Error,
  response: IncomingMessage,
  body: string,
  requestData: RequestData<T>,
  options?: RecommendedStrategyOptions,
  callback?: Callback
): void {
  options = options || {}
  options.retryFactor = options.retryFactor || RETRY_FACTOR
  options.maxRetries = options.maxRetries || MAX_RETRIES
  options.backoffMaxInterval = options.backoffMaxInterval || BACKOFF_MAX_INTERVAL


  if (response) {
    requestData.client.logger.debug('Response status: ', response.statusCode)
  }

  const parsedResponse = parseResponse(error, response)
  if (parsedResponse.error) {
    requestData.client.logger.debug('Encountered error: ', parsedResponse.error)
  }

  const recommendedAction = parsedResponse.recommendedAction

  switch (recommendedAction) {
    case RecommendedAction.Success: {
      return success(requestData, callback)
    }

    case RecommendedAction.Discard: {
      return dropData(requestData, parsedResponse.error, callback)
    }

    case RecommendedAction.Retry: {
      return retry(requestData, options, callback)
    }

    case RecommendedAction.SplitRetry: {
      return splitAndRetry(requestData, options, callback)
    }

    case RecommendedAction.RetryAfter: {
      return retryAfter(parsedResponse.retryAfterMs, requestData, options, callback)
    }

    case RecommendedAction.Backoff: {
      return retryWithBackoff(requestData, parsedResponse.error, options, callback)
    }

    default: {
      const unexpectedError =
        new Error(`Unexpected action: ${RecommendedAction[recommendedAction]}`)

      requestData.client.logger.error(unexpectedError.message)
      return dropData(requestData, unexpectedError, callback)
    }
  }
}

function success<T extends Batch>(requestData: RequestData<T>, cb: Callback): void {
  const { client, originalData } = requestData

  const dataCount = originalData.getBatchSize()
  client.logger.debug(`Successfully sent ${dataCount} data points.`)

  if (cb) {
    setImmediate(cb, null, RecommendedAction.Success)
  }
}

function dropData<T extends Batch>(
  requestData: RequestData<T>,
  error: Error,
  cb: Callback
): void {
  const { client, originalData } = requestData

  const discardedDataCount = originalData.getBatchSize()

  client.logger.error(
    `Send failed. Discarding ${discardedDataCount} data points.`
  )

  if (cb) {
    setImmediate(cb, error, RecommendedAction.Discard)
  }
}

function retry<T extends Batch>(
  requestData: RequestData<T>,
  options: RecommendedStrategyOptions,
  cb: Callback
): void {
  const { client, originalData } = requestData

  const retryCount = requestData.retryCount || 1

  if (retryCount > options.maxRetries) {
    client.logger.info('Maximum retries reached.')
    return dropData(requestData, null, cb)
  }

  const retryMs = options.retryFactor * 1000
  client.logger.info(`Send failed. Retrying in ${retryMs}ms.`)

  setTimeout((): void => {
    const handler = createRetryHandler(retryCount, options, cb)
    client.send(originalData, handler)
  }, retryMs)
}

function splitAndRetry<T extends Batch>(
  requestData: RequestData<T>,
  options: RecommendedStrategyOptions,
  cb: Callback
): void {
  const { client, originalData } = requestData

  const retryCount = requestData.retryCount || 1

  if (retryCount > options.maxRetries) {
    client.logger.info('Maximum retries reached.')
    return dropData(requestData, null, cb)
  }

  const retryMs = options.retryFactor * 1000

  client.logger.info(`Batch size too large, splitting and retrying in ${retryMs}ms.`)
  const batches = originalData.split()

  const batchCount = batches.length

  setTimeout((): void => {
    for (let i = 0; i < batchCount; i++) {
      const smallBatch: T = batches[0] as T

      const handler = createRetryHandler(retryCount, options, onAllBatchesHandled)
      client.send(smallBatch, handler)
    }
  }, retryMs)

  let sentBatches = 0
  let lastError: Error = null
  let hasDiscard = false
  function onAllBatchesHandled(finalError: Error, finalAction: RecommendedAction): void {
    lastError = finalError || lastError

    if (finalAction === RecommendedAction.Discard) {
      hasDiscard = true
    }

    sentBatches++

    if (sentBatches >= batchCount) {
      const action = hasDiscard ? RecommendedAction.Discard : RecommendedAction.Success

      cb(lastError, action)
    }
  }
}

function retryAfter<T extends Batch>(
  retryAfterMs: number,
  requestData: RequestData<T>,
  options: RecommendedStrategyOptions,
  cb: Callback
): void {
  const { client, originalData } = requestData

  const retryCount = requestData.retryCount || 1

  if (retryCount > options.maxRetries) {
    client.logger.info('Maximum retries reached.')
    return dropData(requestData, null, cb)
  }

  client.logger.error(
    `Send failed. Retrying in ${retryAfterMs}ms.`
  )

  setTimeout((): void => {
    const handler = createRetryHandler(retryCount, options, cb)
    client.send(originalData, handler)
  }, retryAfterMs)
}

function retryWithBackoff<T extends Batch>(
  requestData: RequestData<T>,
  error: Error,
  options: RecommendedStrategyOptions,
  cb: Callback
): void {
  const { client, originalData } = requestData

  const retryCount = requestData.retryCount || 1

  if (retryCount > options.maxRetries) {
    client.logger.info('Maximum retries reached.')
    return dropData(requestData, error, cb)
  }

  // If backoff occurs after other retry-types, it will schedule at the interval
  // as if it had been doing backoff retries the whole time.
  const newInterval = options.retryFactor * Math.pow(2, (retryCount - 1))
  const retryMs = Math.min(options.backoffMaxInterval, newInterval) * 1000

  client.logger.info(
    `Send failed. Retrying with backoff in ${retryMs} milliseconds.`
  )

  setTimeout((): void => {
    const handler = createRetryHandler(retryCount, options, cb)
    client.send(originalData, handler)
  }, retryMs)
}

function createRetryHandler<T extends Batch>(
  retryCount: number,
  options: RecommendedStrategyOptions,
  cb: Callback
): SendCallback<T> {
  return retryHandler

  function retryHandler(
    err: Error,
    res: IncomingMessage,
    body: string,
    retryData: RequestData<T>
  ): void {
    retryData.retryCount = retryCount + 1
    return recommendedStrategyHandler(err, res, body, retryData, options, cb)
  }
}
