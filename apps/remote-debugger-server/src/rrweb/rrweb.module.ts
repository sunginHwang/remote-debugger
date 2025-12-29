import { Module } from '@nestjs/common';
import { RrwebController } from './rrweb.controller';
import { RrwebService } from './rrweb.service';

@Module({
  imports: [],
  controllers: [RrwebController],
  providers: [RrwebService],
})
export class RrwebModule {}
