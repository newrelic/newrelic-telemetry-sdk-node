import { BaseClient, SendDataOptions, SendDataCallback } from '../base-client'
import { SpanBatch } from './batch'

const SPAN_HOST = 'trace-api.newrelic.com'
const SPAN_PATH = '/trace/v1'
const SPAN_DATA_FORMAT = 'newrelic'
const SPAN_DATA_FORMAT_VERSION = 1
const INVALID_KEY_MESSAGE = 'A valid key must be provided for inserting spans.'

export interface SpanClientOptions {
  apiKey: string
  host?: string
}

export class SpanClient extends BaseClient<SpanBatch> {
  private readonly _hasValidKey: boolean
  private readonly _sendDataOptions: SendDataOptions

  public constructor(options: SpanClientOptions) {
    super()

    this._hasValidKey = this._isValidKey(options && options.apiKey)

    const headers = {
      'Api-Key': options && options.apiKey,
      'Data-Format': SPAN_DATA_FORMAT,
      'Data-Format-Version': SPAN_DATA_FORMAT_VERSION,
    }

    this._sendDataOptions = {
      headers: headers,
      host: (options && options.host) || SPAN_HOST,
      pathname: SPAN_PATH,
      port: 443
    }
  }

  private _isValidKey(insertKey: string): boolean {
    return !!insertKey
  }

  public send(data: SpanBatch, callback: SendDataCallback): void {
    if (!this._hasValidKey) {
      const keyError = new Error(INVALID_KEY_MESSAGE)
      callback(keyError, null, null)
    }

    const payload = `[${JSON.stringify(data)}]`

    this._sendData(this._sendDataOptions, payload, callback)
  }
}
