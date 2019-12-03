import { IncomingMessage, IncomingHttpHeaders } from 'http'
import { RequestResponseError } from './base-client'

export enum Reaction {
  Success,
  Discard,
  SplitRetry,
  RetryAfter,
  Backoff,
  Error
}

const discardCodes = new Set([
  400,
  403,
  404,
  405,
  411
])

interface ParsedResponse {
  suggestedReaction: Reaction
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
    suggestedReaction: Reaction.Backoff
  }

  if (status < 400) {
    parsedResponse.suggestedReaction = Reaction.Success
  } else if (discardCodes.has(status)) {
    parsedResponse.suggestedReaction = Reaction.Discard
  } else if (status === 413) {
    parsedResponse.suggestedReaction = Reaction.SplitRetry
  } else if (status === 429) {
    parsedResponse.suggestedReaction = Reaction.RetryAfter
    const retryTimeInMs = parseInt(headers['retry-after'].toString(), 10) * 1000
    parsedResponse.retryAfterMs = retryTimeInMs
  }

  return parsedResponse
}

function parseError(error: Error): ParsedResponse {
  const parsedResponse: ParsedResponse = {
    suggestedReaction: Reaction.Error,
    error: error
  }

  if (error instanceof RequestResponseError) {
    parsedResponse.suggestedReaction = Reaction.Backoff
  }

  return parsedResponse
}
