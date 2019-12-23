import { SummaryValue } from './summary'
import { AttributeMap } from '../attributeMap'

export enum MetricType {
  Summary = 'summary',
  Gauge = 'gauge',
  Count = 'count'
}

export type MetricValue = number | SummaryValue

export interface Metric {
  name: string
  value: MetricValue
  type?: MetricType
  attributes?: AttributeMap
  timestamp?: number
  'interval.ms'?: number
}

export abstract class MetricBase<ValueT extends MetricValue>
implements Metric {
  public name: string
  public value: ValueT

  public type: MetricType
  public attributes?: AttributeMap

  public timestamp?: number
  public 'interval.ms'?: number

  // eslint-disable-next-line max-params
  public constructor(
    name: string,
    type: MetricType = MetricType.Gauge,
    value: ValueT,
    attributes?: AttributeMap,
    timestamp?: number,
    intervalMs?: number
  ) {
    this.name = name
    this.type = type
    this.value = value

    if (attributes && Object.keys(attributes).length > 0) {
      this.attributes = attributes
    }

    this.timestamp = timestamp
    this['interval.ms'] = intervalMs
  }

  abstract record(value: number): this
}
