import test from 'tape'
import https, { RequestOptions } from 'https'
import uuidv4 from 'uuid/v4'
import { OutgoingHttpHeaders, IncomingMessage } from 'http'

import {Log, LogBatch, LogClient, LogClientOptions} from '../../src/telemetry/logs'


const LOGGING_DELAY_MS = 1000

const logConfig: LogClientOptions = {
  apiKey: process.env.TEST_API_KEY,
  host: process.env.TEST_LOG_HOST
}

export function verifyLogs(
  t: test.Test,
  testId: string,
  callback: () => void
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
    findLog(testId, (error, logEvents?: object[]): void => {
      t.error(error, 'should not error grabbing results')

      t.equal(
        logEvents.length,
        2,
      )

      callback()
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

    const log1 = new Log(
      'log1',
      Date.now(),
      {
        'name': 'firstTest',
        'service.name': 'overridden-node-sdk-test-entity',
      })

    const log2 = new Log(
      'log2',
      Date.now(),
      {
        name: 'secondTest',
        anotherProp: 'anotherValue',
      })

    const batch = new LogBatch([log1, log2], attributes)

    const client = new LogClient(logConfig)

    client.send(batch, (err, res, body): void => {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)
      verifyLogs(t, testId, t.end)
    })
  })
})
