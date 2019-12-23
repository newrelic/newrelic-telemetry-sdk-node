import { IncomingMessage, IncomingHttpHeaders } from 'http'
import { RequestResponseError } from './base-client'

export enum RecommendedAction {
  Success,
  Discard,
  Retry,
  SplitRetry,
  RetryAfter,
  Backoff
}

const discardCodes = new Set([
  400,
  401,
  403,
  404,
  405,
  409,
  410,
  411
])

interface ParsedResponse {
  recommendedAction: RecommendedAction
  retryAfterMs?: number
  error?: Error
}

export function parseResponse(err: Error, res: IncomingMessage): ParsedResponse {
  if (err) {
    return parseError(err)
  }

  return parseStatus(res.statusCode, res.headers)
}

function parseStatus(status: number, headers: IncomingHttpHeaders): ParsedResponse {
  const parsedResponse: ParsedResponse = {
    recommendedAction: RecommendedAction.Backoff
  }

  if (status < 300) {
    parsedResponse.recommendedAction = RecommendedAction.Success
  } else if (discardCodes.has(status)) {
    parsedResponse.recommendedAction = RecommendedAction.Discard
  } else if (status === 408) {
    parsedResponse.recommendedAction = RecommendedAction.Retry
  } else if (status === 413) {
    parsedResponse.recommendedAction = RecommendedAction.SplitRetry
  } else if (status === 429) {
    parsedResponse.recommendedAction = RecommendedAction.RetryAfter
    const retryTimeInMs = parseInt(headers['retry-after'].toString(), 10) * 1000
    parsedResponse.retryAfterMs = retryTimeInMs
  }

  return parsedResponse
}

function parseError(error: Error): ParsedResponse {
  const parsedResponse: ParsedResponse = {
    recommendedAction: RecommendedAction.Discard,
    error: error
  }

  if (error instanceof RequestResponseError) {
    parsedResponse.recommendedAction = RecommendedAction.Backoff
    parsedResponse.error = error.innerError
  }

  return parsedResponse
}
