import test from 'tape'
import semver from 'semver'
import {BaseClient, SendCallback} from '../../src/client/base-client'

class MockBatch {
}

class MockClient extends BaseClient<MockBatch> {
  public send(data: MockBatch, callback: SendCallback<MockBatch>): void {
    data
    callback
  }

  public getUserAgentHeaderValue(name: string, version: string): string {
    return super.getUserAgentHeaderValue(name, version)
  }
}

test('User-Agent setting', (t): void => {
  t.ok(BaseClient, 'imported BaseClient')
  t.ok(MockClient, 'we have a mock client')

  t.test('test user agent without product', (t): void => {
    const client = new MockClient
    const header = client.getUserAgentHeaderValue(
      'foo', BaseClient.getPackageVersion()
    )

    const parts         = header.split('/')
    const version       = parts.pop()
    const agentName     = parts.join('/')

    t.ok(agentName === 'foo', 'set header name correctly')
    t.ok(semver.valid(version),'version is a valid string')
    t.end()
  })

  t.test('test api that sets additional product', (t): void => {
    const client = new MockClient
    client.addVersionInfo('bar', '1.2.3')
    const twoPartHeader = client.getUserAgentHeaderValue(
      'foo', BaseClient.getPackageVersion()
    )

    const nameParts     = twoPartHeader.split(' ')

    const sdkHeader     = nameParts.shift()
    const parts         = sdkHeader.split('/')
    const versionParts  = parts.pop().split('.')
    const agentName     = parts.join('/')

    t.ok(agentName === 'foo', 'set header name correctly')
    t.ok(3 === versionParts.length, 'version string has three parts')
    for (const item of versionParts.entries()) {
      const versionPart = item.pop().toString()
      // is numeric integer
      t.ok(
        Number(parseInt(versionPart,10)) === parseInt(versionPart, 10),
        'version part numeric'
      )
    }

    const productHeader   = nameParts.shift()
    t.ok('bar/1.2.3' === productHeader)

    t.end()
  })

  t.end()
})
