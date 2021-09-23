import { BaseClient, SendDataOptions, SendCallback, RequestData } from '../base-client'
import { EventBatch } from './batch'
import { Logger} from '../../common'

const EVENT_HOST = 'insights-collector.newrelic.com'
const EVENT_PORT = 443
const EVENT_PATH = '/v1/accounts/events'
const INVALID_KEY_MESSAGE = 'A valid key must be provided for inserting events.'

export interface EventClientOptions {
  /**
   * API key with insert access used to authenticate the request.
   * For more information on creating keys, please see:
   * https://docs.newrelic.com/docs/insights/insights-data-sources/custom-data/introduction-event-api#register
   */
  apiKey: string
  /**
   * Optional host override for event endpoint.
   */
  host?: string
  /**
   * Optional port override for trace endpoint.
   */
  port?: number
}

export class EventClient extends BaseClient<EventBatch> {
  private readonly _hasValidKey: boolean
  private readonly _sendDataOptions: SendDataOptions

  public constructor(options: EventClientOptions, logger?: Logger) {
    super(logger)

    this._hasValidKey = this._isValidKey(options && options.apiKey)

    const headers = {
      'Api-Key': options && options.apiKey,
    }

    this._sendDataOptions = {
      headers: headers,
      host: (options && options.host) || EVENT_HOST,
      pathname: EVENT_PATH,
      port: (options && options.port) || EVENT_PORT
    }
  }

  private _isValidKey(insertKey: string): boolean {
    return !!insertKey
  }

  /**
   * Sends a EventBatch to the New Relic Event endpoint.
   * @param data
   * @param callback
   */
  public send(data: EventBatch, callback: SendCallback<EventBatch>): void {
    if (!this._hasValidKey) {
      const keyError = new Error(INVALID_KEY_MESSAGE)
      callback(keyError, null, null)
    }

    const retryData: RequestData<EventBatch> = {
      client: this,
      originalData: data
    }

    const payload = JSON.stringify(data.flattenData())

    this._sendData(this._sendDataOptions, payload, (err, res, body): void => {
      callback(err, res, body, retryData)
    })
  }
}
