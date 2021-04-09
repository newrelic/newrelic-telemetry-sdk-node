import test from 'tape'
import { Event } from '../../../src/telemetry/events/event'

test('Event', (t): void => {
  t.test('sets required properties', (t): void => {
    const date = Date.now()
    const event = new Event('TestEvent', {foo: 'bar'}, date)

    t.equal(event.eventType, 'TestEvent', 'eventType is set')
    t.equal(event.attributes.foo, 'bar', 'attribute is set')
    t.equal(event.timestamp, date, 'timestamp is set')
    t.end()
  })
})
