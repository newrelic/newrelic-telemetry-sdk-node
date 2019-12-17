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

Once installed, you can get started with a simple program that will send an individual metric to New Relic.

    //...

## Key Concepts

The Telemetry SDK provider you, the end-user-programmer, with a _Client_ that sends _Spans_ or _Metrics_ to New Relic.  Clients can send Spans and Metrics to New Relic individually, or via batches.  Batches (a _MetricBatch_ or _SpanBatch_ object) collect individual metrics together for later sending.

In addition to the examples below, the integration tests contains a number of examples that show how clients, metrics, spans, and batches are all used.

## Span Overview and Examples

To get stared with spans, use code similar to the following.

    // @TODO: Typescript or Javascript?  Dependant on how we publish
    // code samples that shows how to instantiate a span, add it to
    // a batch, and then send that batch with a clients

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

    // @TODO: Typescript or Javascript?  Dependant on how we publish
    // code samples that show how to instantiate a metric, add it to
    // a batch, and then send that batch with a client.  Show example
    // of each metric type

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

## Community

New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices. Like all official New Relic open source projects, there's a related Community topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

https://discuss.newrelic.com/

## Issues / Enhancement Requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](../../issues). Please search for and review the existing open issues before submitting a new issue.

## Contributing

Contributions are welcome (and if you submit a Enhancement Request, expect to be invited to contribute it yourself :grin:). Please review our [Contributors Guide](CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource+newrelic-telemetry-sdk-node@newrelic.com.
