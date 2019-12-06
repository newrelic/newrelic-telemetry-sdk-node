import { MetricBase, MetricType } from './metric'
import { AttributeMap } from '../attributeMap'

export interface SummaryValue {
  count: number
  sum: number
  min: number
  max: number
}

export class SummaryMetric extends MetricBase<SummaryValue> {
  public constructor(
    name: string,
    value: SummaryValue = {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity
    },
    attributes?: AttributeMap,
    timestamp?: number,
    intervalMs?: number
  ) {
    super(name, MetricType.Summary, value, attributes, timestamp, intervalMs)
  }

  public record(value: number): this {
    ++this.value.count
    this.value.sum += value
    this.value.min = Math.min(this.value.min, value)
    this.value.max = Math.max(this.value.max, value)

    return this
  }
}

