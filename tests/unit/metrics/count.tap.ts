import test from 'tape'
import { CountMetric } from '../../../src/client/metrics/count'

test('Count metrics', (t): void => {
  t.test('should accept optional non-name parameters', (t): void => {
    let c = new CountMetric(
      'test count'
    )
    t.equal(c.name, 'test count', 'should have proper name')
    t.equal(c.value, 0, 'should have proper value')
    t.notOk(c.attributes, 'should have no attributes')
    t.equal(c.timestamp, undefined, 'should have no timestamp')
    t.equal(c['interval.ms'], undefined, 'should have no interval')

    c = new CountMetric(
      'test count',
      2,
      {
        testAttribute: 'asdf'
      },
      4321,
      90210
    )
    t.equal(c.value, 2, 'should have proper value')
    t.equal(c.name, 'test count', 'should have proper name')
    t.ok(c.attributes, 'should have no attributes')
    t.equal(c.attributes.testAttribute, 'asdf', 'should have proper attributes')
    t.equal(c.timestamp, 4321, 'should have no timestamp')
    t.equal(c['interval.ms'], 90210, 'should have the proper interval')
    t.end()
  })

  t.test('should properly aggregate recorded values', (t): void => {
    let c = new CountMetric(
      'test count',
      2
    )
    t.equal(c.value, 2, 'should have proper value')
    c.record()
    t.equal(c.value, 3, 'should have proper value')
    c.record(2)
    t.equal(c.value, 5, 'should have proper value')
    t.end()
  })

  t.end()
})
