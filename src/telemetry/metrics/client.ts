import { BaseClient, SendDataOptions, SendCallback, RequestData } from '../base-client'
import { MetricBatch } from './batch'
import { Logger} from '../../common'

const METRIC_HOST = 'metric-api.newrelic.com'
const METRIC_PATH = '/metric/v1'
const INVALID_KEY_MESSAGE = 'A valid key must be provided for inserting metrics.'

export interface MetricClientOptions {
  /**
   * API key with insert access used to authenticate the request.
   * For more information on creating keys, please see:
   * https://docs.newrelic.com/docs/insights/insights-data-sources/custom-data/introduction-event-api#register
   */
  apiKey: string
  /**
   * Optional host override for metrics endpoint.
   */
  host?: string
}

export class MetricClient extends BaseClient<MetricBatch>  {
  private readonly _hasValidKey: boolean
  private readonly _sendDataOptions: SendDataOptions

  public constructor(options: MetricClientOptions, logger?: Logger) {
    super(logger)

    this._hasValidKey = this._isValidKey(options && options.apiKey)

    const headers = {
      'Api-Key': options && options.apiKey
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

  /**
   * Sends a MetricBatch to the New Relic Metrics endpoint.
   * @param data
   * @param  callback
   */
  public send(data: MetricBatch, callback: SendCallback<MetricBatch>): void {
    if (!this._hasValidKey) {
      const keyError = new Error(INVALID_KEY_MESSAGE)
      callback(keyError, null, null)
    }

    const retryData: RequestData<MetricBatch> = {
      client: this,
      originalData: data
    }

    const payload = `[${JSON.stringify(data)}]`

    this._sendData(this._sendDataOptions, payload, (err, res, body): void => {
      callback(err, res, body, retryData)
    })
  }
}
