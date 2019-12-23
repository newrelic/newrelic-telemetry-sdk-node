import https, { RequestOptions } from 'https'
import { OutgoingHttpHeaders, IncomingMessage } from 'http'
import { Logger, NoOpLogger } from '../common'

import zlib from 'zlib'
import url from 'url'

const HTTP_METHOD = 'POST'
const _defaultHeaders: OutgoingHttpHeaders = {
  'Connection': 'Keep-Alive',
  'Content-Type': 'application/json'
}

export interface SendDataOptions {
  host: string
  port: number
  pathname: string
  headers?: OutgoingHttpHeaders
  query?: string | null | { [key: string]: string | number }
}

/**
 * Client and data used to send data to SDK endpoints.
 * Aids in handling of send responses, primarily for retries and data splitting.
 * Allows the addition of any arbitrary metadata to help with further processing
 */
export interface RequestData<T> {
  /**
   * Client used to make the request.
   */
  client: BaseClient<T>
  /**
   * Original data (not serialized) sent in the request.
   */
  originalData: T
  /**
   * Allows any additional metadata to be added to aid in request processing.
   */
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface SendCallback<T> {
  (
    error: Error,
    response: IncomingMessage,
    body: string,
    requestData?: RequestData<T>
  ): void
}

export class RequestResponseError extends Error {
  public innerError: Error

  public constructor(message: string, innerError?: Error) {
    super(message) // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain

    this.innerError = innerError
  }
}

export abstract class BaseClient<T> {
  private product: string
  private productVersion: string
  private userAgentHeader: string
  private packageVersion: string
  public logger: Logger

  public constructor(logger: Logger = new NoOpLogger()) {
    this.logger = logger
  }

  public abstract send(data: T, callback: SendCallback<T>): void
  public addVersionInfo(
    product: string,
    productVersion: string): void {
    this.product = product
    this.productVersion = productVersion
  }

  protected getUserAgentHeaderValue(name: string, version: string): string {
    if (!this.userAgentHeader) {
      let header = name + '/' + version
      if (this.product && this.productVersion) {
        header += ' ' + this.product + '/' + this.productVersion
      }
      this.userAgentHeader =  header
    }

    return this.userAgentHeader
  }

  public static getPackageVersion = function(): string {
    if (!this.packageVersion) {
      try {
        this.packageVersion = require('../../../package.json').version
      } catch (e) {
        this.packageVersion = require('../../package.json').version
      }
    }
    return this.packageVersion
  }

  protected _sendData(
    sendOptions: SendDataOptions,
    payload: string,
    callback: (error: Error, response: IncomingMessage, body: string) => void
  ): void {
    // TODO: avoid compression for smaller amounts of data?
    zlib.gzip(payload, (err, compressed): void => {
      if (err) {
        callback(err, null, null)
        return
      }

      const headers: OutgoingHttpHeaders = sendOptions.headers || {}
      Object.assign(headers, _defaultHeaders)

      headers.Host = sendOptions.host
      headers['Content-Encoding'] = 'gzip'
      headers['Content-Length'] = compressed.length
      headers['User-Agent'] = this.getUserAgentHeaderValue(
        'NewRelic-nodejs-TelemetrySDK',
        BaseClient.getPackageVersion()
      )


      const agentKeepAlive = new https.Agent({keepAlive: true})

      const options: RequestOptions = {
        agent: agentKeepAlive,
        method: HTTP_METHOD,
        setHost: false, // Valid Node 9+, defaults true. Manually set header for Node 8+.
        host: sendOptions.host,
        port: sendOptions.port,
        path: url.format({pathname: sendOptions.pathname, query: sendOptions.query}),
        headers
      }

      const req = https.request(options)
      req.on('error', (error): void => {
        callback(new RequestResponseError(error.message, error), null, null)
      })

      req.on('response', (res: IncomingMessage): void => {
        res.setEncoding('utf8')

        let rawBody = ''

        res.on('data', (data: string): void => {
          rawBody += data
        })

        res.on('error', (error): void => {
          callback(new RequestResponseError(error.message, error), res, null)
        })

        res.on('end', (): void => {
          callback(null, res, rawBody)
        })
      })

      req.write(compressed)
      req.end()
    })
  }
}
