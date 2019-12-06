import test from 'tape'
import { Span } from '../../../src/client/spans/span'

test('Span', (t): void => {
  t.test('sets attributes property if sub property exists', (t): void => {
    const span = new Span('id', 'tracid', 3, 'wingspan')

    t.ok(span.attributes)
    t.end()
  })

  t.test('adds attribute properties that were set in constructor', (t): void => {
    const span = new Span('id', 'trace', 3, undefined, '3333', undefined, 22)

    t.ok(span.attributes['parent.id'])
    t.ok(span.attributes['duration.ms'])
    t.notOk(span.attributes.name)
    t.notOk(span.attributes['service.name'])
    t.end()
  })
})
