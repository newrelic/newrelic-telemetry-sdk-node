import { MetricBase, MetricAttributeMap, MetricType } from './metric'

export class CountMetric extends MetricBase<number> {
  public constructor(
    name: string,
    value: number = 0,
    attributes?: MetricAttributeMap,
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
