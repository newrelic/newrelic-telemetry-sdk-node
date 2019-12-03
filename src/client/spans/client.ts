import { BaseClient, SendDataOptions, SendDataCallback } from '../base-client'
import { SpanBatch } from './batch'

const SPAN_HOST = 'staging-collector.newrelic.com'
const SPAN_METHOD_NAME = 'external_span_data'
const RAW_METHOD_PATH = '/agent_listener/invoke_raw_method'
const INVALID_KEY_MESSAGE = 'A valid key must be provided for inserting spans.'

export interface SpanClientOptions {
  licenseKey: string
  host?: string
}

export class SpanClient extends BaseClient<SpanBatch> {
  private readonly _hasValidKey: boolean
  private readonly _sendDataOptions: SendDataOptions

  public constructor(options: SpanClientOptions) {
    super()

    this._hasValidKey = this._isValidKey(options && options.licenseKey)

    const query = {
      protocol_version: 1,
      license_key: options && options.licenseKey,
      method: SPAN_METHOD_NAME
    }

    this._sendDataOptions = {
      host: (options && options.host) || SPAN_HOST,
      port: 443,
      pathname: RAW_METHOD_PATH,
      query
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

    const payload = `${JSON.stringify(data)}`

    this._sendData(this._sendDataOptions, payload, callback)
  }
}
