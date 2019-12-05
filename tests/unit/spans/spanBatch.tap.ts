import test from 'tape'
import { SpanBatch } from '../../../src/client/spans/batch'

test('Span batch', (t): void => {
  t.test('sets properties on initialization', (t): void => {
    const batch = new SpanBatch()

    t.same(batch.spans, [], 'sets spans to empty array')
    t.notOk(batch.common, 'Does not add common property if no attributes provided')

    t.end()
  })

  t.test('adds attributes to common.attributes prop when provided in constructor',
    (t): void => {
      const attributes = {
        'name': 'name',
        'service.name': 'serviceName',
        'duration.ms': 808,
        'host': 'with the most'
      }

      const batch = new SpanBatch(attributes)

      t.equal(batch.common.attributes['duration.ms'], 
        808, 'sets duration.ms attribute')
      t.equal(batch.common.attributes['service.name'], 
        'serviceName', 'sets service.name attribute')
      t.equal(batch.common.attributes.name, 'name', 'sets name attribute')
      t.equal(batch.common.attributes.host, 'with the most', 'sets host attribute')

      t.end()
    })
})
