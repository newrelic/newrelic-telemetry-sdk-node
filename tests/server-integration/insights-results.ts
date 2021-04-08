import test from 'tape'
import https, { RequestOptions } from 'https'
import { OutgoingHttpHeaders, IncomingMessage } from 'http'

export enum NewRelicFeature {
  Metrics = 'Metrics',
  DistributedTracing = 'Distributed%20Tracing',
  EventApi = 'Event%20API'
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
  const requestId = parsedBody.requestId

  t.ok(requestId, 'Body should contain the request Id')

  getNrIntegrationErrors(requestId, feature, (error, integrationErrors): void => {
    t.error(error, 'should not error grabbing results')

    t.equal(
      integrationErrors.length,
      0,
      `Should not have any integration errors ${JSON.stringify(integrationErrors)}`
    )

    callback()
  })
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
      const parsed = JSON.parse(rawBody)

      const firstResult = parsed.results && parsed.results[0]
      const events = firstResult && firstResult.events

      cb(parsed.error, events || [])
    })
  })

  req.end()
}
