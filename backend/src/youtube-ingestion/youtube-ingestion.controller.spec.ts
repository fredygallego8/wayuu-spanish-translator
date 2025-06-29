import { Test, TestingModule } from '@nestjs/testing';
import { YoutubeIngestionController } from './youtube-ingestion.controller';

describe('YoutubeIngestionController', () => {
  let controller: YoutubeIngestionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YoutubeIngestionController],
    }).compile();

    controller = module.get<YoutubeIngestionController>(YoutubeIngestionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
