import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemEvent, SystemEventPayload } from '@pestras/stores-sales-core/common';
import { ID } from 'src/util/types';

@Injectable()
export class EventsService {

  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit<T = any>(event: SystemEventPayload<ID, T>) {
    const e = new SystemEvent(event);
    this.eventEmitter.emit(e.name, e);
  }
}
