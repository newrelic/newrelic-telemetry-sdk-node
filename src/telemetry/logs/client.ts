import {BaseClient, RequestData, SendCallback, SendDataOptions} from '../base-client'
import {LogBatch} from './model'
import {Logger} from '../../common'

const LOG_HOST = 'log-api.newrelic.com'
const LOG_PORT = 443
const LOG_PATH = '/log/v1'
const INVALID_KEY_MESSAGE = 'A valid key must be provided for inserting logs.'

export interface LogClientOptions {
  /**
   * API key with insert access used to authenticate the request.
   * For more information on creating keys, please see:
   * https://docs.newrelic.com/docs/logs/log-management/log-api/introduction-log-api/#compatibility-requirements
   */
  apiKey: string
  /**
   * Optional host override for log endpoint.
   */
  host?: string
  /**
   * Optional port override for log endpoint.
   */
  port?: number
}

export class LogClient extends BaseClient<LogBatch> {
  private readonly _hasValidKey: boolean
  private readonly _sendDataOptions: SendDataOptions

  public constructor(options: LogClientOptions, logger?: Logger) {
    super(logger)

    this._hasValidKey = LogClient._isValidKey(options && options.apiKey)

    const headers = {
      'Api-Key': options && options.apiKey,
    }

    this._sendDataOptions = {
      headers: headers,
      host: (options && options.host) || LOG_HOST,
      pathname: LOG_PATH,
      port: (options && options.port) || LOG_PORT
    }
  }

  private static _isValidKey(insertKey: string): boolean {
    return !!insertKey
  }

  /**
     * Sends a LogBatch to the New Relic Logs endpoint.
     * @param data
     * @param callback
     */
  public send(data: LogBatch, callback: SendCallback<LogBatch>): void {
    if (!this._hasValidKey) {
      const keyError = new Error(INVALID_KEY_MESSAGE)
      callback(keyError, null, null)
    }

    const retryData: RequestData<LogBatch> = {
      client: this,
      originalData: data
    }

    const payload = `[${JSON.stringify(data)}]`

    this._sendData(this._sendDataOptions, payload, (err, res, body): void => {
      callback(err, res, body, retryData)
    })
  }
}
