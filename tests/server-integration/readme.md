# Server Integration Tests

These tests communicate with New Relic servers for inserting metrics and spans and also query the Insights API to check for potential errors.

To function locally, they require several environment variables to be set. Specific values will vary based on account and also environment.

Here's the list of variables and what a few of the values may look like:

```
TEST_INSIGHTS_HOST=insights-api.newrelic.com
TEST_SPAN_HOST=trace-api.newrelic.com
TEST_METRIC_HOST=metric-api.newrelic.com
TEST_QUERY_KEY=<insights query (not insert) key>
TEST_API_KEY=<insights insert (not query) key>
TEST_ACCOUNT_NUM=<account # matching keys>
```

To run the tests, execute: `npm run server-integration`.
