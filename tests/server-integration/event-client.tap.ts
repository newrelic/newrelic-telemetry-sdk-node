import test from 'tape'

import { verifyNrIntegrationErrors, NewRelicFeature } from './insights-results'

import {
  EventClient,
  EventClientOptions,
  EventBatch,
  Event
} from '../../src/telemetry/events'

const eventConfig: EventClientOptions = {
  apiKey: process.env.TEST_API_KEY,
  host: process.env.TEST_EVENT_HOST
}

test('Event Client - Server Integration Tests', (t): void => {
  t.ok(eventConfig.apiKey, 'TEST_API_KEY must be configured for tests')

  t.test('Should send batch of individually added events', (t): void => {
    const attributes = {
      foo: 'bar'
    }

    const batch = new EventBatch(attributes)

    const event1: Event = {
      eventType: 'TestEvent',
      timestamp: Date.now(),
      attributes: {
        foo: 'baz',
        bar: 'baz',
      }
    }

    const event2: Event = {
      eventType: 'AnotherTestEvent',
      timestamp: Date.now(),
      attributes: {
        foo: 'bar',
      }
    }

    batch.addEvent(event1)
    batch.addEvent(event2)

    const client = new EventClient(eventConfig)

    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 200)
      verifyNrIntegrationErrors(t, NewRelicFeature.EventApi, body, t.end)
    })
  })

  t.test('should send batch from event interface', (t): void => {
    const batch = new EventBatch()

    const event1: Event = {
      eventType: 'TestEvent',
      timestamp: Date.now(),
      attributes: {
        foo: 'bar',
      }
    }

    batch.addEvent(event1)

    const client = new EventClient(eventConfig)
    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 200)
      verifyNrIntegrationErrors(t, NewRelicFeature.EventApi, body, t.end)
    })
  })

  t.test('should send custom attributes', (t): void => {
    const batch = new EventBatch()
    const attributes = {
      testAttribute1: 'one attribute',
      testAttribute2: 'two attribute'
    }

    const event = new Event('TestEvent', attributes, Date.now())

    batch.addEvent(event)

    const client = new EventClient(eventConfig)
    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 200)
      verifyNrIntegrationErrors(t, NewRelicFeature.EventApi, body, t.end)
    })
  })
})
