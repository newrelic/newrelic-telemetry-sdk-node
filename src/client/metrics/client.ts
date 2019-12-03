import { BaseClient, SendDataOptions, SendDataCallback } from '../base-client'
import { MetricBatch } from './batch'

const METRIC_HOST = 'staging-metric-api.newrelic.com'
const METRIC_PATH = '/metric/v1'
const INVALID_KEY_MESSAGE = 'A valid key must be provided for inserting metrics.'

export interface MetricClientOptions {
  insertKey: string
  host?: string
}

export class MetricClient extends BaseClient<MetricBatch>  {
  private readonly _hasValidKey: boolean
  private readonly _sendDataOptions: SendDataOptions

  public constructor(options: MetricClientOptions) {
    super()

    this._hasValidKey = this._isValidKey(options && options.insertKey)

    const headers = {
      'X-Insert-Key': options && options.insertKey
    }

    this._sendDataOptions = {
      host: (options && options.host) || METRIC_HOST,
      port: 443,
      pathname: METRIC_PATH,
      headers: headers
    }
  }

  private _isValidKey(insertKey: string): boolean {
    return !!insertKey
  }

  public send(data: MetricBatch, callback: SendDataCallback): void {
    if (!this._hasValidKey) {
      const keyError = new Error(INVALID_KEY_MESSAGE)
      callback(keyError, null, null)
    }

    // We could create an array and call sendMany but this avoids the
    // array allocation.
    const payload = `[${JSON.stringify(data)}]`

    this._sendData(this._sendDataOptions, payload, callback)
  }

  public sendMany(data: MetricBatch[], callback: SendDataCallback): void {
    if (!this._hasValidKey) {
      const keyError = new Error(INVALID_KEY_MESSAGE)
      callback(keyError, null, null)
    }

    const payload = JSON.stringify(data)

    this._sendData(this._sendDataOptions, payload, callback)
  }
}
