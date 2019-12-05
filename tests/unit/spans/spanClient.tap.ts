import test from 'tape'
import { Span } from '../../../src/client/spans'

test('Span client', (t):void => {
  t.test('sets properties', () => {
    const date = Date.now()
    const span = new Span('SpanId', 'TraceId', date)

    t.equal(span.id, 'SpanId', 'id is set')
    t.equal(span['trace.id'], 'TraceId', 'trace.id is set')
    t.equal(span.timestamp, date, 'date is set')
    t.end()
  })
})
