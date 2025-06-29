import { IsUrl, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IngestYoutubeDto {
  @ApiProperty({
    description: 'The URL of the YouTube video to ingest.',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsUrl({}, { message: 'Please provide a valid URL.' })
  @Matches(
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/,
    { message: 'The URL must be a valid YouTube link.' }
  )
  url: string;
} 