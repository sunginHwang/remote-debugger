import { Module } from '@nestjs/common';
import { AppController } from './controllers/app/app.controller';
import { AppService } from './app.service';
import { RrwebModule } from './rrweb/rrweb.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, RrwebModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
