import { MetricBase, MetricAttributeMap, MetricType } from './metric'

export class GaugeMetric extends MetricBase<number> {
  public constructor(
    name: string,
    value: number,
    attributes?: MetricAttributeMap,
    timestamp?: number
  ) {
    super(name, MetricType.Gauge, value, attributes, timestamp)
  }

  public record(value: number): this {
    this.value = value

    return this
  }
}
