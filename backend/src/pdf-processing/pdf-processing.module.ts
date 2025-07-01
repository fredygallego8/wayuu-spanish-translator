import { Module } from '@nestjs/common';
import { PdfProcessingService } from './pdf-processing.service';
import { PdfProcessingController } from './pdf-processing.controller';

@Module({
  providers: [PdfProcessingService],
  controllers: [PdfProcessingController],
  exports: [PdfProcessingService],
})
export class PdfProcessingModule {}
