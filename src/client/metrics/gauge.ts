import { MetricBase, MetricType } from './metric'
import { AttributeMap } from '../attributeMap'

export class GaugeMetric extends MetricBase<number> {
  public constructor(
    name: string,
    value: number,
    attributes?: AttributeMap,
    timestamp: number = Date.now()
  ) {
    super(name, MetricType.Gauge, value, attributes, timestamp)
  }

  public record(value: number): this {
    this.value = value
    this.timestamp = Date.now()
    return this
  }
}
