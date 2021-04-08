import test from 'tape'
import { EventBatch } from '../../../src/telemetry/events/batch'

test('EventBatch', (t): void => {
  t.test('sets properties on initialization', (t): void => {
    const batch = new EventBatch()

    t.same(batch.events, [], 'sets events to empty array')
    t.notOk(batch.common, 'Does not add common property if no attributes provided')
    t.end()
  })

  t.test('adds attributes to common.attributes prop when provided in constructor',
    (t): void => {
      const attributes = {
        'name': 'name',
        'service.name': 'serviceName',
        'host': 'with the most'
      }

      const batch = new EventBatch(attributes)

      t.equal(batch.common.attributes['service.name'],
        'serviceName', 'sets service.name attribute')
      t.equal(batch.common.attributes.name, 'name', 'sets name attribute')
      t.equal(batch.common.attributes.host, 'with the most', 'sets host attribute')
      t.end()
    })
})
