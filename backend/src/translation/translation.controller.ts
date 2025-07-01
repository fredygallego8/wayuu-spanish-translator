import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TranslationService } from './translation.service';
import { 
  TranslateDto, 
  TranslationResponseDto, 
  PhoneticAnalysisDto,
  PhoneticAnalysisResult,
  LearningExerciseDto,
  LearningExercise
} from './dto/translate.dto';

@ApiTags('translation')
@Controller('translation')
export class TranslationController {
  private readonly logger = new Logger(TranslationController.name);

  constructor(private readonly translationService: TranslationService) {}

  @Post('translate')
  @ApiOperation({ summary: 'Translate text between Wayuu and Spanish' })
  @ApiResponse({
    status: 200,
    description: 'Translation successful',
    type: TranslationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input',
  })
  async translate(@Body() translateDto: TranslateDto): Promise<TranslationResponseDto> {
    this.logger.log(`Translation request: ${translateDto.text} (${translateDto.direction})`);
    return this.translationService.translate(translateDto);
  }

  @Post('phonetic-analysis')
  @ApiOperation({ summary: 'Analyze phonetic patterns of Wayuu text' })
  @ApiResponse({
    status: 200,
    description: 'Phonetic analysis completed successfully',
  })
  async analyzePhonetics(@Body() phoneticDto: PhoneticAnalysisDto): Promise<{
    success: boolean;
    data: PhoneticAnalysisResult;
    message: string;
  }> {
    this.logger.log(`Phonetic analysis request: ${phoneticDto.text}`);
    
    try {
      const analysis = await this.translationService.analyzePhonetics(phoneticDto);
      
      return {
        success: true,
        data: analysis,
        message: `Phonetic analysis completed for "${phoneticDto.text}"`
      };
    } catch (error) {
      this.logger.error(`Phonetic analysis error: ${error.message}`);
      return {
        success: false,
        data: null as any,
        message: `Error in phonetic analysis: ${error.message}`
      };
    }
  }

  @Post('learning-exercises')
  @ApiOperation({ summary: 'Generate learning exercises for Wayuu language' })
  @ApiResponse({
    status: 200,
    description: 'Learning exercises generated successfully',
  })
  async generateExercises(@Body() exerciseDto: LearningExerciseDto): Promise<{
    success: boolean;
    data: LearningExercise[];
    message: string;
  }> {
    this.logger.log(`Learning exercise request: ${exerciseDto.exerciseType} (${exerciseDto.difficulty})`);
    
    try {
      const exercises = await this.translationService.generateLearningExercise(exerciseDto);
      
      return {
        success: true,
        data: exercises,
        message: `Generated ${exercises.length} ${exerciseDto.exerciseType} exercises`
      };
    } catch (error) {
      this.logger.error(`Exercise generation error: ${error.message}`);
      return {
        success: false,
        data: [],
        message: `Error generating exercises: ${error.message}`
      };
    }
  }

  @Post('learning-exercises-massive')
  @ApiOperation({ summary: 'Generate massive learning exercises using full 7K+ dataset' })
  @ApiResponse({
    status: 200,
    description: 'Massive learning exercises generated successfully',
  })
  async generateMassiveLearningExercises(@Body() exerciseDto: LearningExerciseDto & {
    useFullDataset?: boolean;
    frequencyBasedDifficulty?: boolean;
    adaptiveDifficulty?: boolean;
    includeAudioExercises?: boolean;
  }): Promise<{
    success: boolean;
    data: LearningExercise[];
    message: string;
    metadata: {
      exerciseType: string;
      difficulty: string;
      count: number;
      datasetSize: string;
      generationTime: number;
    };
  }> {
    const startTime = Date.now();
    
    this.logger.log(`Massive exercise generation request: ${exerciseDto.exerciseType} - ${exerciseDto.difficulty}`);
    
    try {
      // Valores por defecto optimizados para dataset masivo
      const enhancedDto = {
        ...exerciseDto,
        count: exerciseDto.count || 10,
        difficulty: exerciseDto.difficulty || 'intermediate',
        useFullDataset: exerciseDto.useFullDataset !== false, // default true
        frequencyBasedDifficulty: exerciseDto.frequencyBasedDifficulty !== false, // default true
        adaptiveDifficulty: exerciseDto.adaptiveDifficulty !== false, // default true
        includeAudioExercises: exerciseDto.includeAudioExercises !== false // default true
      };

      const exercises = await this.translationService.generateMassiveExercises(enhancedDto);
      const generationTime = Date.now() - startTime;
      
      return {
        success: true,
        data: exercises,
        message: `Generated ${exercises.length} massive exercises using 7K+ dataset in ${generationTime}ms`,
        metadata: {
          exerciseType: enhancedDto.exerciseType,
          difficulty: enhancedDto.difficulty,
          count: exercises.length,
          datasetSize: '7,033+ entries',
          generationTime
        }
      };
    } catch (error) {
      this.logger.error(`Massive exercise generation error: ${error.message}`);
      const generationTime = Date.now() - startTime;
      
      return {
        success: false,
        data: [],
        message: `Error generating massive exercises: ${error.message}`,
        metadata: {
          exerciseType: exerciseDto.exerciseType || 'unknown',
          difficulty: exerciseDto.difficulty || 'unknown',
          count: 0,
          datasetSize: '7,033+ entries (failed)',
          generationTime
        }
      };
    }
  }

  @Get('phonetic-patterns')
  @ApiOperation({ summary: 'Get common Wayuu phonetic patterns' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'] })
  async getPhoneticPatterns(@Query('difficulty') difficulty?: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    this.logger.log(`Phonetic patterns request: difficulty=${difficulty || 'all'}`);
    
    try {
      // This would analyze the audio dataset to find common patterns
      const patterns = {
        vowels: ['a', 'e', 'i', 'o', 'u', 'ü'],
        consonants: ['ch', 'j', 'k', 'l', 'm', 'n', 'ñ', 'p', 'r', 's', 'sh', 't', 'w', 'y'],
        specialChars: ['ꞌ'],
        commonCombinations: [
          { pattern: 'ch-a', frequency: 'high', difficulty: 'medium' },
          { pattern: 'ü-n', frequency: 'medium', difficulty: 'hard' },
          { pattern: 'sh-i', frequency: 'medium', difficulty: 'medium' },
          { pattern: 'ꞌ-a', frequency: 'high', difficulty: 'hard' }
        ],
        stressPatterns: [
          { type: 'penultimate', description: 'Acento en penúltima sílaba', frequency: 'high' },
          { type: 'ultimate', description: 'Acento en última sílaba', frequency: 'medium' }
        ]
      };

      let filteredPatterns = patterns;
      if (difficulty) {
        filteredPatterns = {
          ...patterns,
          commonCombinations: patterns.commonCombinations.filter(p => p.difficulty === difficulty)
        };
      }

      return {
        success: true,
        data: filteredPatterns,
        message: `Retrieved phonetic patterns${difficulty ? ` for ${difficulty} level` : ''}`
      };
    } catch (error) {
      this.logger.error(`Error getting phonetic patterns: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `Error retrieving phonetic patterns: ${error.message}`
      };
    }
  }

  @Get('learning-progress')
  @ApiOperation({ summary: 'Get learning progress and recommendations' })
  @ApiQuery({ name: 'userId', required: false })
  async getLearningProgress(@Query('userId') userId?: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    this.logger.log(`Learning progress request for user: ${userId || 'anonymous'}`);
    
    try {
      // This would track user progress in a real implementation
      const progress = {
        userId: userId || 'anonymous',
        completedExercises: {
          pronunciation: 0,
          listening: 0,
          vocabulary: 0,
          patternRecognition: 0
        },
        currentLevel: 'beginner',
        strengths: ['vocabulary', 'basic pronunciation'],
        weaknesses: ['complex phonemes', 'stress patterns'],
        recommendations: [
          'Practice words with oclusión glotal (ꞌ)',
          'Focus on distinguishing ü from other vowels',
          'Work on penultimate stress patterns'
        ],
        nextExercises: [
          { type: 'pronunciation', difficulty: 'beginner', focus: 'basic vowels' },
          { type: 'listening', difficulty: 'beginner', focus: 'short phrases' }
        ]
      };

      return {
        success: true,
        data: progress,
        message: `Learning progress retrieved for ${userId || 'anonymous user'}`
      };
    } catch (error) {
      this.logger.error(`Error getting learning progress: ${error.message}`);
      return {
        success: false,
        data: null,
        message: `Error retrieving learning progress: ${error.message}`
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for translation service' })
  async getHealth() {
    return this.translationService.getHealthStatus();
  }

  @Get('datasets')
  @ApiOperation({ summary: 'Get available datasets information' })
  async getDatasets() {
    return this.translationService.getAvailableDatasets();
  }
}