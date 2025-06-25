import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatasetsService } from './datasets.service';
import { DatasetsController } from './datasets.controller';

@Module({
  imports: [ConfigModule],
  controllers: [DatasetsController],
  providers: [DatasetsService],
  exports: [DatasetsService],
})
export class DatasetsModule {}