import { MetricBase, MetricAttributeMap, MetricType } from './metric'

export class GaugeMetric extends MetricBase<number> {
  public constructor(
    name: string,
    value: number,
    attributes?: MetricAttributeMap,
    timestamp?: number,
    intervalMs?: number
  ) {
    super(name, MetricType.Gauge, value, attributes, timestamp, intervalMs)
  }

  public record(value: number): MetricBase<number> {
    this.value = value

    return this
  }
}
