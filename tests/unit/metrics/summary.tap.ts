import test from 'tape'
import { SummaryMetric } from '../../../src/client/metrics/summary'

test('Summary metrics', (t): void => {
  t.test('should accept optional non-name parameters', (t): void => {
    let s = new SummaryMetric(
      'test summary'
    )
    t.equal(s.name, 'test summary', 'should have proper name')
    t.deepEqual(s.value, {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity
    }, 'should have proper value')
    t.notOk(s.attributes, 'should have no attributes')
    t.equal(s.timestamp, undefined, 'should have no timestamp')
    t.equal(s['interval.ms'], undefined, 'should have no interval')

    s = new SummaryMetric(
      'test summary',
      {
        count: 1,
        sum: 2,
        min: 2,
        max: 2
      },
      {
        testAttribute: 'asdf'
      },
      4321,
      90210
    )
    t.deepEqual(s.value, {
      count: 1,
      sum: 2,
      min: 2,
      max: 2
    }, 'should have proper value')
    t.equal(s.name, 'test summary', 'should have proper name')
    t.ok(s.attributes, 'should have no attributes')
    t.equal(s.attributes.testAttribute, 'asdf', 'should have proper attributes')
    t.equal(s.timestamp, 4321, 'should have no timestamp')
    t.equal(s['interval.ms'], 90210, 'should have the proper interval')
    t.end()
  })

  t.test('should properly aggregate recorded values', (t): void => {
    let s = new SummaryMetric(
      'test summary',
      {
        count: 1,
        sum: 2,
        min: 2,
        max: 2
      },
    )
    t.deepEqual(s.value, {
      count: 1,
      sum: 2,
      min: 2,
      max: 2
    }, 'should have proper value')
    s.record(2345)
    t.deepEqual(s.value, {
      count: 2,
      sum: 2347,
      min: 2,
      max: 2345
    }, 'should have proper value')
    t.end()
  })

  t.end()
})
