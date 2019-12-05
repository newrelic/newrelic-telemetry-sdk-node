import { MetricBase, MetricType } from './metric'
import { AttributeMap } from '../attributeMap'

export class CountMetric extends MetricBase<number> {
  public constructor(
    name: string,
    value: number = 0,
    attributes?: AttributeMap,
    timestamp?: number,
    intervalMs?: number
  ) {
    super(name, MetricType.Count, value, attributes, timestamp, intervalMs)
  }

  public record(value: number = 1): MetricBase<number> {
    this.value += value

    return this
  }
}
