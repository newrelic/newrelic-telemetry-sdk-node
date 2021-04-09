import test from 'tape'
import https, { RequestOptions } from 'https'
import { OutgoingHttpHeaders, IncomingMessage } from 'http'

const CHECK_RESULTS_DELAY_MS = 1000

export enum NewRelicFeature {
  Metrics = 'Metrics',
  DistributedTracing = 'Distributed%20Tracing',
  EventApi = 'Event%20API'
}

interface NRIntegrationError {
  apiKeyPrefix: string
  category: string
  message: string
  name: string
  newRelicFeature: string
  requestId: string
  timestamp: string
}

export function verifyNrIntegrationErrors(
  t: test.Test,
  feature: NewRelicFeature,
  body: string,
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

  const parsedBody = JSON.parse(body)
  // Event API returns uuid and success items.
  // Trace/Metrics return requestId.
  // NRIntegrationError uses both for 'requestId'.
  const requestId = parsedBody.requestId || parsedBody.uuid

  t.ok(requestId, 'Body should contain the request Id')

  // Sometimes seems takes > 500ms for errors to show up in API query.
  setTimeout((): void => {
    getNrIntegrationErrors(requestId, feature, (error, integrationErrors): void => {
      t.error(error, 'should not error grabbing results')

      t.equal(
        integrationErrors.length,
        0,
        `Should not have any integration errors ${JSON.stringify(integrationErrors)}`
      )

      callback()
    })
  }, CHECK_RESULTS_DELAY_MS)
}

export function getNrIntegrationErrors(
  requestId: number,
  feature: NewRelicFeature,
  cb: (error: Error, integrationErrors?: object[]) => void
): void {
  const host = process.env.TEST_INSIGHTS_HOST
  const accountNumber = process.env.TEST_ACCOUNT_NUM

  const path = `/v1/accounts/${accountNumber}/query?` +
               `nrql=SELECT%20*%20FROM%20NrIntegrationError%20` +
              `where%20newRelicFeature='${feature}'%20and%20requestId='${requestId}'`

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

      events.forEach((errorEvent: NRIntegrationError): void => {
        // It is just the prefix but obfuscating anyways.
        errorEvent.apiKeyPrefix = '*****'
      })

      cb(parsed.error, events)
    })
  })

  req.end()
}
