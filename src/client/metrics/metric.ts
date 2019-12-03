import { SummaryValue } from './summary'

export enum MetricType {
  Summary = 'summary',
  Gauge = 'gauge',
  Count = 'count'
}

export type MetricValue = number | SummaryValue

export interface MetricAttributeMap {
  [attribute: string]: string | number | boolean
}

export interface Metric {
  name: string
  value: MetricValue
  type?: MetricType
  attributes?: MetricAttributeMap
  timestamp?: number
  'interval.ms'?: number
}

export abstract class MetricBase<ValueT extends MetricValue>
implements Metric {
  public name: string
  public value: ValueT

  public type: MetricType
  public attributes?: MetricAttributeMap

  public timestamp?: number
  public 'interval.ms'?: number

  // eslint-disable-next-line max-params
  public constructor(
    name: string,
    type: MetricType = MetricType.Gauge,
    value: ValueT,
    attributes?: MetricAttributeMap,
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

  abstract record(value: number): MetricBase<ValueT>
}
