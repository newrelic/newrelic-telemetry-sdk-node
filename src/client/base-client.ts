import https, { RequestOptions } from 'https'
import { OutgoingHttpHeaders, IncomingMessage } from 'http'

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

export interface SendDataCallback {
  (error: Error, response: IncomingMessage, body: string): void
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

  public abstract send(data: T, callback: SendDataCallback): void
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
    return require('../../package.json').version
  }

  protected _sendData(
    sendOptions: SendDataOptions,
    payload: string,
    callback: SendDataCallback
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


      const agentKeepAlive = new https.Agent({keepAlive:true})

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
