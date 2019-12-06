import test from 'tape'
import { Span } from '../../../src/client/spans/span'

test('Span', (t): void => {
  t.test('sets required properties', (t): void => {
    const date = Date.now()
    const span = new Span('SpanId', 'TraceId', date)

    t.equal(span.id, 'SpanId', 'id is set')
    t.equal(span['trace.id'], 'TraceId', 'trace.id is set')
    t.equal(span.timestamp, date, 'date is set')
    t.end()
  })

  t.test('sets attributes property if sub property exists', (t): void => {
    const span = new Span('id', 'tracid', 3, 'wingspan')

    t.ok(span.attributes)
    t.end()
  })

  t.test('adds attribute properties that were set in constructor', (t): void => {
    const span = new Span('id', 'trace', 3, 'name', '3333', undefined)
    const span2 = new Span('id', 'trace', 2, undefined, undefined, 'service', 20)

    t.ok(span.attributes['parent.id'])
    t.ok(span.attributes.name)
    t.notOk(span.attributes['duration.ms'])
    t.notOk(span.attributes['service.name'])

    t.ok(span2.attributes['duration.ms'])
    t.ok(span2.attributes['service.name'])
    t.notOk(span2.attributes.name)
    t.notOk(span2.attributes['parent.id'])

    t.end()
  })

  t.test('should set attributes when supplied to constructor', (t): void => {
    const attributes = {
      'name': 'traceName',
      'parent.id': 'parentid',
      'service.name': 'service',
      'duration.ms': 20
    }
    const span = new Span('id', 'trace', 3, 
      undefined, undefined, undefined, undefined,
      attributes)
  
    t.ok(span.attributes['parent.id'])
    t.equal(span.attributes['parent.id'], 'parentid')
    t.ok(span.attributes.name)
    t.equal(span.attributes.name, 'traceName')
    t.ok(span.attributes['duration.ms'])
    t.equal(span.attributes['duration.ms'], 20)
    t.ok(span.attributes['service.name'])
    t.equal(span.attributes['service.name'], 'service')

    t.end()
  })

  t.test('constructor attribute fields should override attribute props', (t): void => {
    const attributes = {
      'name': 'traceName',
      'parent.id': 'parentid',
      'service.name': 'service',
      'duration.ms': 20
    }
    const span = new Span('id', 'trace', 3, 
      'overrideName', 'overrideParent', 'overrideService', 0,
      attributes)

    t.equal(span.attributes.name, 'overrideName')
    t.equal(span.attributes['parent.id'], 'overrideParent')
    t.equal(span.attributes['service.name'], 'overrideService')
    t.equal(span.attributes['duration.ms'], 0)

    t.end()
  })

  t.test('should set custom attributes', (t): void => {
    const attributes = {
      'host': 'twinkies',
      'donuts': 12
    }
    const span = new Span('id', 'trace', 3, 
      undefined, undefined, undefined, undefined,
      attributes)

    t.true(Object.keys(span.attributes).includes('host'))
    t.true(Object.keys(span.attributes).includes('donuts'))

    t.end()
  })
})
