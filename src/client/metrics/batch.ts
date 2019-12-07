import { Metric } from './metric'
import { AttributeMap } from '../attributeMap'

interface CommonMetricData {
  attributes?: AttributeMap
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

  protected readonly LIMIT = 2000
  public metrics: Metric[]

  public constructor(
    attributes?: AttributeMap,
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

    // if the client programmer passed us an array that's
    // too big, keep the first `this.LIMIT` items and
    // then use addMetric to add the rest (making the later
    // items subject to the adaptive sampling)
    if (this.metrics.length > this.LIMIT) {
      const remnant = this.metrics.splice(this.LIMIT)
      for (const idAndRemnant of remnant.entries()) {
        this.addMetric(idAndRemnant[1])
      }
    }
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

    // keep metrics array at its limited value
    while (this.LIMIT < this.metrics.length) {
      this.metrics.splice(this.getRandomInt(0, this.LIMIT - 1), 1)
    }
    return this
  }

  // get a random number between min and max, inclusive
  protected getRandomInt(min: number, max: number): number {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(
      Math.random() * ((max + 1) - min)
    ) + min
  }
}

