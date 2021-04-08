import { Event, EventData } from './event'
import { AttributeMap } from '../attributeMap'

interface CommonEventData {
  attributes?: AttributeMap
}

interface EventBatchPayload {
  events?: EventData[]
  common?: CommonEventData
}

export const LIMIT = 2000

export class EventBatch implements EventBatchPayload {
  public common?: CommonEventData
  public events: Event[]

  public constructor(
    attributes?: AttributeMap,
    events?: EventData[]
  ) {
    if (attributes) {
      const common: CommonEventData = {}

      common.attributes = attributes
      this.common = common
    }

    this.events = events || []
    // if the client programmer passed us an array that's
    // too big, keep the first `LIMIT` items and
    // then use addEvent to add the rest (making the later
    // items subject to the adaptive sampling)
    if (this.events.length > LIMIT) {
      const remnant = this.events.splice(LIMIT)
      this.addEvent(...remnant)
    }
  }

  public addEvent(...events: Event[]): EventBatch {
    for (let event of events) {
      this.events.push(event)
      const len = this.events.length
      // keep events array at its limited value
      if (len > LIMIT) {
        const indexToDrop = this.getRandomInt(0, len - 1)
        const droppedEvent = this.events[indexToDrop]
        this.events[indexToDrop] = this.events[len - 1]
        this.events[len - 1] = droppedEvent
        this.events.pop()
      }
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

  public getBatchSize(): number {
    return this.events.length
  }

  public split(): EventBatch[] {
    if (this.events.length === 0) {
      return []
    }

    if (this.events.length === 1) {
      const events = [this.events[0]]
      const batch = EventBatch.createNew(this.common, events)

      return [batch]
    }

    const midpoint = Math.floor(this.events.length / 2)
    const leftEvents = this.events.slice(0, midpoint)
    const rightEvents = this.events.slice(midpoint)

    const leftBatch = EventBatch.createNew(this.common, leftEvents)
    const rightBatch = EventBatch.createNew(this.common, rightEvents)

    return [leftBatch, rightBatch]
  }

  private static createNew(common: CommonEventData, events: EventData[]): EventBatch {
    const batch = new EventBatch(common && common.attributes, events)
    return batch
  }

  public flattenData(): AttributeMap[] {
    return this.events.map((event: Event): AttributeMap => {
	  return { 
	    ...this.common.attributes,
	    ...event.attributes,
	    eventType: event.eventType,
	    timestamp: event.timestamp
      }
    })
  }
}
