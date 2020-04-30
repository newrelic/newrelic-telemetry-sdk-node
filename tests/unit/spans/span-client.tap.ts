import test from 'tape'
import { SpanClient, SpanClientOptions } from '../../../src/telemetry/spans/client'

/* eslint-disable dot-notation */
test('SpanClient', (t): void => {
  t.test('Should use default host and port when not specified in constructor',
    (t): void => {
      const SPAN_HOST = 'trace-api.newrelic.com'
      const SPAN_PORT = 443

      const opts: SpanClientOptions = {
        apiKey: '323242342'
      }
      const spanClient = new SpanClient(opts)

      t.equals(spanClient['_sendDataOptions'].host, SPAN_HOST)
      t.equals(spanClient['_sendDataOptions'].port, SPAN_PORT)

      t.end()
    })

  t.test('Should accept custom host and port on instantiation', (t): void => {
    const customHost = 'example.com'
    const customPort = 30000

    const opts: SpanClientOptions = {
      apiKey: '123232312312313',
      host: customHost,
      port: customPort
    }
    const spanClient = new SpanClient(opts)

    t.equals(spanClient['_sendDataOptions'].host, customHost)
    t.equals(spanClient['_sendDataOptions'].port, customPort)
    t.end()
  })

  t.end()
})
