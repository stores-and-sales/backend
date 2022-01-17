import { Global, Module } from '@nestjs/common';
import { ValidallPipe } from './pipes/validall.pipe';
import { DBService } from './services/db.service';
import { EventsService } from './services/events.service';

@Global()
@Module({
  providers: [
    DBService,
    EventsService,
    { provide: 'VALIDALL_PIPE_TOKEN', useValue: String },
    ValidallPipe
  ],
  exports: [DBService, EventsService, ValidallPipe]
})
export class GlobalModule {}
