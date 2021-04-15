# CHANGELOG

## 0.4.0 (2021-04-15)
* Adds support for the Event API. (Thank you @kolanos for the contribution)
* Adds support for the New Relic Log API. (Thank you @MattWhelan for the contribution)
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
