import test from 'tape'
import https, { RequestOptions } from 'https'
import uuidv4 from 'uuid/v4'
import { OutgoingHttpHeaders, IncomingMessage } from 'http'

import {Log, LogBatch, LogClient, LogClientOptions} from '../../src/telemetry/logs'


const LOGGING_DELAY_MS = 1500

const logConfig: LogClientOptions = {
  apiKey: process.env.TEST_API_KEY,
  host: process.env.TEST_LOG_HOST
}

interface LogEvent { [key: string]: string }

export function verifyLogs(
  t: test.Test,
  testId: string,
  callback: (logEvents?: LogEvent[]) => void
): void {
  t.ok(
    process.env.TEST_ACCOUNT_NUM,
    'TEST_ACCOUNT_NUM must be configured to verify NRIntegrationError events.'
  )

  t.ok(
    process.env.TEST_QUERY_KEY,
    'TEST_QUERY_KEY must be configured to verify NRIntegrationError events.'
  )

  // Sometimes seems takes > 500ms for errors to show up in API query.
  setTimeout((): void => {
    findLog(testId, (error, logEvents?: LogEvent[]): void => {
      t.error(error, 'should not error grabbing results')

      callback(logEvents)
    })
  }, LOGGING_DELAY_MS)
}

function findLog(
  testId: string,
  cb: (error: Error, integrationErrors?: object[]) => void
): void {
  const host = process.env.TEST_INSIGHTS_HOST
  const accountNumber = process.env.TEST_ACCOUNT_NUM

  // noinspection SqlNoDataSourceInspection
  const path = `/v1/accounts/${accountNumber}/query?nrql=`
      + encodeURIComponent(`SELECT * FROM Log WHERE testId='${testId}'`)

  const headers: OutgoingHttpHeaders = {
    'Accept': 'application/json',
    'X-Query-Key': process.env.TEST_QUERY_KEY,
    'Host': host
  }

  const options: RequestOptions = {
    method: 'GET',
    setHost: false, // Valid Node 9+, defaults true. Manually set header for Node 8+.
    host: host,
    path: path,
    headers
  }

  const req = https.request(options)
  req.on('error', (error): void => {
    cb(error)
  })

  req.on('response', (res: IncomingMessage): void => {
    res.setEncoding('utf8')

    let rawBody = ''

    res.on('data', (data: string): void => {
      rawBody += data
    })

    res.on('error', (error): void => {
      cb(error)
    })

    res.on('end', (): void => {
      if (res.statusCode >= 300) {
        cb(new Error(`Status Error: ${res.statusCode}`))
        return
      }

      const parsed = JSON.parse(rawBody)

      const firstResult = parsed.results && parsed.results[0]
      const events = firstResult && firstResult.events || []

      cb(parsed.error, events)
    })
  })

  req.end()
}

test('Log Client - Server Integration Tests', (t): void => {
  t.ok(logConfig.apiKey, 'TEST_API_KEY must be configured for tests')

  t.test('Should send batch of logs', (t): void => {
    const testId = 'test-' + uuidv4()
    const attributes = {
      'name': 'commonName',
      'service.name': 'node-sdk-test-entity',
      'testId': testId
    }

    const log1Ts = Date.now() - 10
    const log1 = new Log(
      'log1',
      log1Ts,
      {
        aProp: 'someValue',
      })

    const log2Ts = log1Ts + 1
    const log2 = new Log(
      'log2',
      log2Ts,
      {
        anotherProp: 'anotherValue',
      })

    const batch = new LogBatch([log1, log2], attributes)

    const client = new LogClient(logConfig)

    const resultAssertions = (logEvents?: LogEvent[]): void => {
      t.ok(logEvents, 'Falsy logEvents')
      t.equal(logEvents.length, 2, 'unexpected log event count')

      let event1 = logEvents[0]
      let event2 = logEvents[1]
      if (event1.timestamp > event2.timestamp) {
        const temp = event2
        event2 = event1
        event1 = temp
      }

      t.equal(event1.timestamp, log1Ts, 'event 1 timestamp')
      t.equal(event1.name, 'commonName', 'event 1 name')
      t.equal(event1.aProp, 'someValue',
        'event 1 aProp')

      t.equal(event2.timestamp, log2Ts, 'event 2 timestamp')
      t.equal(event2.name, 'commonName', 'event 2 name')
      t.equal(event2.anotherProp, 'anotherValue',
        'event 2 anotherProp')

      t.end()
    }
    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)
      verifyLogs(t, testId, resultAssertions)
    })
  })
})
