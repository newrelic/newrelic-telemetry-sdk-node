_**In the next 3-6 months, we plan to EOL the New Relic Node.js Telemetry SDK. If you are using the Telemetry SDK to send OpenTelemetry data to New Relic, we recommend using the OpenTelemetry Collector with the New Relic Exporter as an alternative. You can find an details in the quick start [here](https://docs.newrelic.com/docs/more-integrations/open-source-telemetry-integrations/opentelemetry/opentelemetry-quick-start/).**_

<br />
<br />
<br />

[![Community Project header](https://github.com/newrelic/open-source-office/raw/master/examples/categories/images/Community_Project.png)](https://github.com/newrelic/open-source-office/blob/master/examples/categories/index.md#community-project)

# New Relic Telemetry SDK for Node.js

The New Relic Node.js Telemetry SDK allows you to send telemetry data to New Relic from your application without a [traditional language agent](https://github.com/newrelic/node-newrelic).

The Telemetry SDK serves as a foundation for getting open standards based telemetry data like [Open Census](https://opencensus.io/), [Open Tracing](https://opentracing.io/), and [Open Telemetry](https://opentelemetry.io/) into New Relic.  If you're building exporters or tracers based on these standards, you've come to the right place.

## Installation

### Prerequisites

- A New Relic Insights API Key
- A Node.js 10+ Runtime

To get started with the Telemetry SDK, you'll need a New Relic Insert API key. If you need help finding or generating this (or any) API key, [our docs have you covered](https://docs.newrelic.com/docs/apis/get-started/intro-apis/types-new-relic-api-keys).

Once you have this key in place, you can install the `@newrelic/telemetry-sdk` package via `npm` (or your preferred package manager)

    $ npm install @newrelic/telemetry-sdk

Once installed, you can get started with a simple program that will create a metric, record one occurrence of that metric, and then send that metric to New Relic in a batch.

```javascript
    const {MetricBatch,CountMetric,MetricClient}
      = require('@newrelic/telemetry-sdk').telemetry.metrics

    // create our client using the metrics API key
    const client = new MetricClient({
      apiKey: 'abc...123'       // your metrics API key
                                // https://docs.newrelic.com/docs/data-ingest-apis/get-data-new-relic/metric-api/introduction-metric-api#access-requirements
    })

    // create the metric object
    const metric = new CountMetric('our-metric')

    // record a single occurance of this metric
    metric.record()


    // create a batch and add our metric
    const batch = new MetricBatch(
      {},              // attributes (or "tags") to send with
                       // every metric in this batch (you can
                       // also set attributes/tags on individual
                       // metrics)
      Date.now(),      // timestamp
      1000             // interval -- how offten we're sending this data in milliseconds
    )
    batch.addMetric(metric)

    client.send(batch, function(err, res, body) {
      console.log(res.statusCode)
    })
```

## Usage

### Key Concepts

The Telemetry SDK provides you, the end-user-programmer, with a _Client_ that sends _Spans_ or _Metrics_ to New Relic.  Individual Metrics and Spans are collected together into batches (via a _MetricBatch_ or _SpanBatch_ object), and clients send these batches.

In addition to the examples below, the integration tests and server-integration tests contain a number of examples that show how clients, metrics, spans, and batches are all used.

### Span Overview and Examples

To get stared with spans, you'll use code similar to the following.

```javascript
    const sdk = require('@newrelic/telemetry-sdk')
    const {
      SpanClient,
      SpanClientOptions,
      SpanBatch,
      Span
    } = require('@newrelic/telemetry-sdk').telemetry.spans
    const uuidv4 = require('uuid/v4')

    // create our client using the metrics API key
    const client = new SpanClient({
      apiKey: 'abc...123'       // your trace API key
                                // https://docs.newrelic.com/docs/understand-dependencies/distributed-tracing/trace-api/report-new-relic-format-traces-trace-api#new-relic-quick-start
    })

    const batch = new SpanBatch;

    const traceId = Date.now().toString()
    const parentId = uuidv4();

    // create a parentSpan object
    const parentSpan = new Span(
        parentId,                   // a unique identifier for a span
        traceId,                    // a unique identifier for this trace,
        Date.now(),                 // a timestamp
        'firstSpan',                // a name for this span
        null,                       // this span's parent, null since this is the top
                                    // level span
        'node-sdk-example-entity',  // a name for ths service being traced
        10                          // span's duration
    );

    // then create some child spans, linking them to the
    // parent via their parent ID
    const child1 = new Span(
        uuidv4(),
        traceId,
        Date.now(),
        'secondSpan',
        parentId,                  // this span's parent
        'node-sdk-example-entity',
        5
    );

    const child2 = new Span(
        uuidv4(),
        traceId,
        Date.now(),
        'thirdSpan',
        parentId,                  // this span's parent
        'node-sdk-example-entity',
        22
    );

    // add the spans to the batch
    batch.addSpan(parentSpan)
    batch.addSpan(child1)
    batch.addSpan(child2)

    // send the batch
    client.send(batch, function(err, res, body) {
      console.log(res.statusCode)
    })
```

The Telemetry SDK provides you with a client and batch objects for sending multiple spans to New Relic in a single HTTPS request.  Where and how you use these objects in your tracers/exporters is up to you.

If you want to use the Telemetry SDK to send spans to an API endpoint other than the default, you can instantiate a `SpanClient` with a specific `host` and `port`.  This isn't something most users will *need* to do, but if you've received an alternative API endpoint from New Relic, or need to send data to a different URL, the `SpanClient` is able to accommodate you.

```javascript
const client = new SpanClient({
      apiKey: 'abc...123',
      host: 'example.com',
      port: 8443
    })
```

### Metrics Overview and Examples

The Telemetry SDK allows you to send three different Metric types to New Relic

- GaugeMetric
- CountMetric
- SummaryMetric

| Metric Type | Interval | Description                                        | Example                                       |
| ----------- | -------- | -------------------------------------------------- | --------------------------------------------- |
| Gauge       | No       | A single value at a single point in time.          | Room Temperature.                             |
| Count       | Yes      | Track the total number of occurrences of an event. | Number of errors that have occurred.          |
| Summary     | Yes      | Track count, sum, min, and max values over time.   | The summarized duration of 100 HTTP requests. |

You can learn more about each individual metric type [via the New Relic Docs Site](https://docs.newrelic.com/docs/data-ingest-apis/get-data-new-relic/metric-api/report-metrics-metric-api#supported-metric-types).  Each individual metric type has a corresponding type in the Telemetry SDK.

```javascript
    const {CountMetric, GaugeMetric, SummaryMetric} =
      require('@newrelic/telemetry-sdk').telemetry.metrics;

    // https://github.com/newrelic/newrelic-telemetry-sdk-node/blob/c678ebfbea6e09f35c30734615030dbc5f46dc12/src/telemetry/metrics/count.ts#L4
    const counting = new CountMetric(...)

    // https://github.com/newrelic/newrelic-telemetry-sdk-node/blob/c678ebfbea6e09f35c30734615030dbc5f46dc12/src/telemetry/metrics/gauge.ts#L4
    const aGauge = new GaugeMetric(...)

    // https://github.com/newrelic/newrelic-telemetry-sdk-node/blob/c678ebfbea6e09f35c30734615030dbc5f46dc12/src/telemetry/metrics/summary.ts#L11
    const summary = new SummaryMetric(...)
```

### Further Reading

If you're interested in learning more about the New Relic metrics and trace APIs that the Telemetry SDK sits on top of, the following links will be of interest.

- [Metric API](https://docs.newrelic.com/docs/data-ingest-apis/get-data-new-relic/metric-api/introduction-metric-api)
- [Trace API](https://docs.newrelic.com/docs/understand-dependencies/distributed-tracing/trace-api/introduction-trace-api)

### Limits

The New Relic Telemetry APIs are rate limited. Please reference the documentation for [New Relic Metrics API](https://docs.newrelic.com/docs/introduction-new-relic-metric-api) and [New Relic Trace API Requirements and Limits](https://docs.newrelic.com/docs/apm/distributed-tracing/trace-api/trace-api-general-requirements-limits) on the specifics of the rate limits.

## Support

Should you need assistance with New Relic products, you are in good hands with several support channels.

If the issue has been confirmed as a bug or is a feature request, file a GitHub issue.

**Support Channels**

* [New Relic Documentation](https://docs.newrelic.com/docs/telemetry-data-platform/get-started/capabilities/telemetry-sdks-send-custom-telemetry-data-new-relic): Comprehensive guidance for using our platform
* [New Relic Community](https://discuss.newrelic.com/tags/nodeagent): The best place to engage in troubleshooting questions
* [New Relic Developer](https://developer.newrelic.com/): Resources for building a custom observability applications
* [New Relic University](https://learn.newrelic.com/): A range of online training for New Relic users of every level

## Privacy

At New Relic we take your privacy and the security of your information seriously, and are committed to protecting your information. We must emphasize the importance of not sharing personal data in public forums, and ask all users to scrub logs and diagnostic information for sensitive information, whether personal, proprietary, or otherwise.

We define “Personal Data” as any information relating to an identified or identifiable individual, including, for example, your name, phone number, post code or zip code, Device ID, IP address, and email address.

For more information, review [New Relic’s General Data Privacy Notice](https://newrelic.com/termsandconditions/privacy).

## Contribute

We encourage your contributions to improve [project name]! Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. You only have to sign the CLA one time per project.

If you have any questions, or to execute our corporate CLA (which is required if your contribution is on behalf of a company), drop us an email at opensource@newrelic.com.

**A note about vulnerabilities**

As noted in our [security policy](../../security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

If you would like to contribute to this project, review [these guidelines](./CONTRIBUTING.md).

To [all contributors](<https://github.com/newrelic/newrelic-telemetry-sdk-node/graphs/contributors), we thank you!  Without your contribution, this project would not be what it is today.  We also host a community project page dedicated to [New Relic Telemetry SDK (Node)](https://opensource.newrelic.com/projects/newrelic/newrelic-telemetry-sdk-node).

## License

`newrelic-telemetry-sdk-node` is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.
