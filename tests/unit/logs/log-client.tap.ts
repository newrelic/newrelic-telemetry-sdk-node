import test from 'tape'
import { LogClient, LogClientOptions } from '../../../src/telemetry/logs/client'

/* eslint-disable dot-notation */
test('LogClient', (t): void => {
  t.test('Should use default host and port when not specified in constructor',
    (t): void => {
      const LOG_HOST = 'log-api.newrelic.com'
      const LOG_PORT = 443

      const opts: LogClientOptions = {
        apiKey: '323242342'
      }
      const logClient = new LogClient(opts)

      t.equals(logClient['_sendDataOptions'].host, LOG_HOST)
      t.equals(logClient['_sendDataOptions'].port, LOG_PORT)

      t.end()
    })

  t.test('Should accept custom host and port on instantiation', (t): void => {
    const customHost = 'example.com'
    const customPort = 30000

    const opts: LogClientOptions = {
      apiKey: '123232312312313',
      host: customHost,
      port: customPort
    }
    const logClient = new LogClient(opts)

    t.equals(logClient['_sendDataOptions'].host, customHost)
    t.equals(logClient['_sendDataOptions'].port, customPort)
    t.end()
  })

  t.end()
})
