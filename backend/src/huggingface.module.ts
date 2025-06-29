import { Module } from '@nestjs/common';
import { HuggingfaceController } from './huggingface/huggingface.controller';
import { HuggingfaceService } from './huggingface/huggingface.service';

@Module({
    imports: [],
    controllers: [HuggingfaceController],
    providers: [HuggingfaceService],
})
export class HuggingfaceModule {}
