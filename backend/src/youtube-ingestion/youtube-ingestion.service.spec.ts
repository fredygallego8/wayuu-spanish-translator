import { Test, TestingModule } from '@nestjs/testing';
import { YoutubeIngestionService } from './youtube-ingestion.service';

describe('YoutubeIngestionService', () => {
  let service: YoutubeIngestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YoutubeIngestionService],
    }).compile();

    service = module.get<YoutubeIngestionService>(YoutubeIngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
