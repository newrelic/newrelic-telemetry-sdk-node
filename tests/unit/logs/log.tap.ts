import test from 'tape'
import {Log, LogBatch} from '../../../src/telemetry/logs/model'

test('Log', (t): void => {
  t.test('sets required properties', (t): void => {
    const ts = Date.now()
    const log = new Log('message', ts)

    t.equal(log.message, 'message')
    t.equal(log.timestamp, ts)

    t.end()
  })

  t.test('sets default timestamp', (t): void => {
    const ts = Date.now()
    const log = new Log('message')

    t.equal(log.message, 'message')
    t.ok(Math.abs(log.timestamp - ts) <= 2)

    t.end()
  })
})

test('LogBatch', (t): void => {
  t.test('sets required properties', (t): void => {
    const batch = new LogBatch([new Log('message')])

    t.equal(batch.logs.length, 1)
    t.equal(batch.logs[0].message, 'message')

    t.end()
  })
})
