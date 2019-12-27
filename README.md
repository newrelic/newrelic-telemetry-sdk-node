# New Relic Telemetry SDK for NodeJS

The New Relic NodeJS Telemetry SDK allows you to send telemetry data to New Relic from your application without a [traditional language agent](https://github.com/newrelic/node-newrelic).

The Telemetry SDK serves as a foundation for getting open standards based telemetry data like [Open Census](https://opencensus.io/), [Open Tracing](https://opentracing.io/), and [Open Telemetry](https://opentelemetry.io/) into New Relic.  If you're building exporters or tracers based on these standards, you've come to the right place.

## Prerequisites

- A New Relic Insights API Key
- A NodeJS 10+ Runtime

## Getting Started

To get started with the telemetry SDK, you'll need a New Relic Insert API key. If you need help finding or generating this (or any) API key, [our docs have you covered](https://docs.newrelic.com/docs/apis/get-started/intro-apis/types-new-relic-api-keys).

Once you have this key in place, you can install the `@newrelic/telemetry-sdk` via `npm` (or your preferred package manager)

    $ npm install @newrelic/telemetry-sdk

Once installed, you can get started with a simple program that will create a metric, record one occurrence of that metric, and then send that metrics to New Relic in a batch.

    const {MetricBatch,CountMetric,MetricClient}
      = require('@newrelic/telemetry-sdk').client.metrics

    // create our client using the metrics API key
    const client = new MetricClient({
      // apiKey: 'abc...123'       // your metrics API key
      //                           // https://docs.newrelic.com/docs/data-ingest-apis/get-data-new-relic/metric-api/introduction-metric-api#access-requirements
    })

    // create the metric object
    const metric = new CountMetric('our-metric')

    // record a single occurance of this metric
    metric.record()


    // create a batch and add our metric
    const batch = new MetricBatch(
      {},              // attributes (or "tags") to send with metric
      Date.now(),      // timestamp
      1000             // interval -- how offten we're sending this data in milliseconds
    )
    batch.addMetric(metric)

    client.send(batch, function(err, res, body) {
      console.log(res.statusCode)
    })

## Key Concepts

The Telemetry SDK provider you, the end-user-programmer, with a _Client_ that sends _Spans_ or _Metrics_ to New Relic.  Individual Metrics and Spans are collected together into batches (via a _MetricBatch_ or _SpanBatch_ object), and clients send these batches.

In addition to the examples below, the integration tests contains a number of examples that show how clients, metrics, spans, and batches are all used.

## Span Overview and Examples

To get stared with spans, you'll use code similar to the following.

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
    const parentSpan = new Span;
    parentSpan['id']         = parentId;
    parentSpan['trace.id']   = traceId;
    parentSpan['timestamp']  = Date.now();
    parentSpan['attributes'] = {
      'name': 'firstSpan',
      'service.name': 'node-sdk-example-entity',
      'duration.ms': 10,
    }

    // then create some child spans, linking them to the
    // parent via the parent.id attribute
    const child1 = new Span;
    child1['id']         = parentId;
    child1['trace.id']   = uuidv4();
    child1['timestamp']  = Date.now();
    child1['attributes'] = {
      'name': 'secondSpan',
      'service.name': 'node-sdk-example-entity',
      'duration.ms': 5,
    }

    // then create some child spans, linking them to the
    // parent via the parent.id attribute
    const child2 = new Span;
    child2['id']         = parentId;
    child2['trace.id']   = uuidv4();
    child2['timestamp']  = Date.now();
    child2['attributes'] = {
      'name': 'thirdSpan',
      'service.name': 'node-sdk-example-entity',
      'parent.id': parentId,
      'duration.ms': 22,
    }

    // add the spans to the batch
    batch.addSpan(parentSpan)
    batch.addSpan(child1)
    batch.addSpan(child2)

    // send the batch
    client.send(batch, function(err, res, body) {
      console.log(res.statusCode)
    })


The Telemetry SDK provides you with a client and batch objects for sending multiple spans to New Relic in a single HTTPS request.  Where and how you use these objects in your tracers/exporters is up to you.

## Metrics Overview and Examples

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

    const {CountMetric, GaugeMetric, SummaryMetric} =
      require('@newrelic/telemetry-sdk').telemetry.metrics;

    // https://github.com/newrelic/newrelic-telemetry-sdk-node/blob/c678ebfbea6e09f35c30734615030dbc5f46dc12/src/telemetry/metrics/count.ts#L4
    const counting = new CountMetric(...)

    // https://github.com/newrelic/newrelic-telemetry-sdk-node/blob/c678ebfbea6e09f35c30734615030dbc5f46dc12/src/telemetry/metrics/gauge.ts#L4
    const aGuage = new GuageMetric(...)

    // https://github.com/newrelic/newrelic-telemetry-sdk-node/blob/c678ebfbea6e09f35c30734615030dbc5f46dc12/src/telemetry/metrics/summary.ts#L11
    const summary = new SummaryMetric(...)

The Telemetry SDK provides you with a client and batch objects for sending multiple spans to New Relic in a single HTTPS request.  Where and how you use these objects in your metric exporters is up to you.

## Further Reading

If you're intersted in learning more about the New Relic metrics and trace APIs that the Telemetry SDK sits on top of, the following links will be of interest.

- [Metric API](https://docs.newrelic.com/docs/data-ingest-apis/get-data-new-relic/metric-api/introduction-metric-api)
- [Trace API](https://docs.newrelic.com/docs/understand-dependencies/distributed-tracing/trace-api/introduction-trace-api)

## Limits

The New Relic Telemetry APIs are rate limited. Please reference the documentation for [New Relic Metrics API](https://docs.newrelic.com/docs/introduction-new-relic-metric-api) and [New Relic Trace API Requirements and Limits](https://docs.newrelic.com/docs/apm/distributed-tracing/trace-api/trace-api-general-requirements-limits) on the specifics of the rate limits.

## Open Source License

This project is distributed under the [Apache 2 license](LICENSE).

## Support

New Relic has open-sourced this project. This project is provided AS-IS WITHOUT WARRANTY OR DEDICATED SUPPORT. Issues and contributions should be reported to the project here on GitHub.

We encourage you to bring your experiences and questions to the [Explorers Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.

## Issues / Enhancement Requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](../../issues). Please search for and review the existing open issues before submitting a new issue.

## Contributing

Contributions are welcome (and if you submit a Enhancement Request, expect to be invited to contribute it yourself :grin:). Please review our [Contributors Guide](CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource+newrelic-telemetry-sdk-node@newrelic.com.
