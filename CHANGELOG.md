# CHANGELOG

## 0.5.0 (2021-09-27)
* Updated hostname for Event API communication. (Thanks for the contribution @tmancill)
* Added 5 retry polling for log event server test to reduce failure rate. It seems it can occasionally take > 5 seconds for the log events to be retrieved.
* Added Node 16 to CI.
* Resolved npm audit warning.
* Added husky and a pre-commit script to automatically update the 3rd party manifest and notices when new packages are installed/updated.

## 0.4.2 (2021-05-17)
* Added batchSize interface to LogBatch class.

## 0.4.1 (2021-05-12)
* The logs client client options, batch and log models can be referenced with `telemetry.logs.*`.
* Added deprecation warning to top of README.md.
* Increased wait time for log-client integration test verification to 3 seconds to mitigate intermittent test failures.

## 0.4.0 (2021-04-15)
* Added support for the Event API. (Thank you @kolanos for the contribution)
* Added support for the New Relic Log API. (Thank you @MattWhelan for the contribution)
* Fixed NRIntegrationError checking server test issues where status code >=300 would be treated as successful and cases where we'd check before errors were available.
* Thank you @zekth for the typo fix contribution.

## 0.3.0 (2020-11-02)
* Removed Node v8.x from CI.
* Added Node v14.x to CI.
* Bumped dev lodash sub-deps to clear up audit warnings.
* Updated README for consistency.
* Removed specific default branch references from non-license docs.
* Splits tests out that need round-trip communication with server to
  server-integration and adds mocked versions.

## 0.2.0 (2020-04-30)

* Custom `port` value can be set when instantiating `SpanClient`.
* Addresses security vulnerabilities from package dependencies.
* Updated third-party notices.

## 0.1.0 (2019-12-27)

* Initial public release of the SDK.
* Support for sending dimensional metrics and spans to New Relic.
