import { MetricAttributeMap, Metric } from './metric'

interface CommonMetricData {
  attributes?: MetricAttributeMap
  timestamp?: number
  'interval.ms'?: number
}

// TODO: Consider ability to send MetricBatch purely via interface. Would
// export in that case.
// TODO: Rename to avoid 'payload'. Find clear wording between interface
// and class.
interface MetricBatchPayload {
  common?: CommonMetricData
  metrics: Metric[]
}

export class MetricBatch implements MetricBatchPayload {
  public common?: CommonMetricData
  public metrics: Metric[]

  public constructor(
    attributes?: MetricAttributeMap,
    timestamp?: number,
    interval?: number,
    metrics?: Metric[]
  ) {
    const common: CommonMetricData = {}

    if (attributes) {
      common.attributes = attributes
    }

    if (interval != null) {
      common['interval.ms'] = interval
    }

    if (timestamp != null) {
      common.timestamp = timestamp
    }

    if (Object.keys(common).length) {
      this.common = common
    }

    this.metrics = metrics || []
  }

  public getBatchSize(): number {
    return this.metrics.length
  }

  public computeInterval(endTime: number): this {
    this.common['interval.ms'] = endTime - this.common.timestamp
    return this
  }

  public addMetric(metric: Metric): MetricBatch {
    this.metrics.push(metric)

    return this
  }
}
