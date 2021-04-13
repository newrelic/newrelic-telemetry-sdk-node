import test from 'tape'
import nock from 'nock'
import zlib from 'zlib'
import {IncomingMessage} from 'http'

import {Log, LogBatch, LogClient, LogClientOptions} from '../../src/telemetry/logs'

const FAKE_API_KEY = 'api key'
const FAKE_HOST = 'test-host.newrelic.com'
const LOG_PATH = '/log/v1'

const logConfig: LogClientOptions = {
  apiKey: FAKE_API_KEY,
  host: FAKE_HOST
}

test('Log Client - Server Integration Tests', (t): void => {
  let rawRequestBody: string = null

  function nockRequestHost(): void {
    nock.disableNetConnect()

    nock(`https://${FAKE_HOST}`).post(LOG_PATH, (body): boolean => {
      rawRequestBody = body
      return true
    }).reply(202, { requestId: 'some id' })
  }

  t.test('Should send batch of individually added logs', (t): void => {
    nockRequestHost()

    const expectedCommonAttributes = {
      'name': 'commonName',
      'service.name': 'node-sdk-test-entity'
    }

    const batch = new LogBatch([], expectedCommonAttributes)

    const log1 = new Log('message1',
      Date.now(),
      {
        'name': 'firstTest',
        'service.name': 'node-sdk-test-entity',
        'duration.ms': 10,
      }
    )

    const log2 = new Log('message2',
      Date.now(),
      {
        'name': 'firstTest',
        'duration.ms': 10,
      })

    batch.append(log1)
    batch.append(log2)

    const client = new LogClient(logConfig)

    client.send(batch, verifySend)

    function verifySend(err: Error, res: IncomingMessage, body: string): void {
      t.error(err)
      t.ok(res)
      t.ok(body)

      t.equal(res.statusCode, 202)

      t.ok(rawRequestBody)

      decodeRequestBody(rawRequestBody, (decodeError, data): void => {
        t.error(decodeError)

        const { common, logs } = data[0] as LogBatch

        t.deepEqual(common.attributes, expectedCommonAttributes)

        const [firstLog, secondLog] = logs
        t.deepEqual(firstLog, log1)
        t.deepEqual(secondLog, log2)

        cleanupNock()
        t.end()
      })
    }
  })
})

function decodeRequestBody(
  encodedData: string, callback:
  (err: Error, data?: object[]) => void
): void {
  // nock stores as hex
  const dataBuffer = Buffer.from(encodedData, 'hex')
  zlib.gunzip(dataBuffer, (err, buff): void => {
    if (err) {
      return callback(err)
    }

    const requestBodyString = buff.toString()
    const requestBody = JSON.parse(requestBodyString)

    callback(null, requestBody)
  })
}

function cleanupNock(): void {
  if (!nock.isDone()) {
    // eslint-disable-next-line no-console
    console.error('Cleaning pending mocks: %j', nock.pendingMocks())
    nock.cleanAll()
  }

  nock.enableNetConnect()
}
