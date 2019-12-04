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
  public abstract send(data: T, callback: SendDataCallback): void

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
      headers['Content-Length'] = String(compressed.length)

      const options: RequestOptions = {
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
        let rawBody = ''

        res.on('data', (data: Buffer): void => {
          rawBody += data.toString('utf8')
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
