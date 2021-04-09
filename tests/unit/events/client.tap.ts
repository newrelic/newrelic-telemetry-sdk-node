import test from 'tape'
import { EventClient, EventClientOptions } from '../../../src/telemetry/events/client'

/* eslint-disable dot-notation */
test('EventClient', (t): void => {
  t.test('Should use default host and port when not specified in constructor',
    (t): void => {
      const EVENT_HOST = 'insights-collector.nr-data.net'
      const EVENT_PORT = 443

      const opts: EventClientOptions = {
        apiKey: '323242342'
      }
      const eventClient = new EventClient(opts)

      t.equals(eventClient['_sendDataOptions'].host, EVENT_HOST)
      t.equals(eventClient['_sendDataOptions'].port, EVENT_PORT)
      t.end()
    })

  t.test('Should accept custom host and port on instantiation', (t): void => {
    const customHost = 'example.com'
    const customPort = 30000

    const opts: EventClientOptions = {
      apiKey: '123232312312313',
      host: customHost,
      port: customPort
    }
    const eventClient = new EventClient(opts)

    t.equals(eventClient['_sendDataOptions'].host, customHost)
    t.equals(eventClient['_sendDataOptions'].port, customPort)
    t.end()
  })

  t.end()
})
