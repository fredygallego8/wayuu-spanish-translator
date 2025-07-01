import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleTranslateService {
  private readonly logger = new Logger(GoogleTranslateService.name);

  constructor(private configService: ConfigService) {}

  /**
   * 🆓 GOOGLE TRANSLATE - GRATIS hasta 500K caracteres/mes
   * Funciona inmediatamente sin configuración adicional
   */
  async translateText(
    text: string,
    sourceLang: 'wayuu' | 'spanish' | 'auto',
    targetLang: 'wayuu' | 'spanish'
  ) {
    const startTime = Date.now();
    
    try {
      // Mapear idiomas wayuu/spanish a códigos Google
      const langMap = {
        wayuu: 'gn', // Guaraní como proxy (similar estructura)
        spanish: 'es',
        auto: 'auto'
      };

      const sourceCode = langMap[sourceLang] || 'auto';
      const targetCode = langMap[targetLang];

      // URL de Google Translate API gratuita (sin API key)
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceCode}&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;

      this.logger.log(`🔄 Google Translate: ${sourceLang} → ${targetLang}`);
      this.logger.log(`📝 Input: "${text.substring(0, 100)}..."`);

      const response = await fetch(url);
      const data = await response.json();
      
      // Parsear respuesta de Google Translate
      const translatedText = data[0]?.[0]?.[0] || text;
      const detectedLang = data[2] || sourceCode;
      
      const processingTime = Date.now() - startTime;
      const confidence = this.calculateBasicConfidence(text, translatedText);

      this.logger.log(`✅ Translation completed in ${processingTime}ms`);
      this.logger.log(`📤 Output: "${translatedText.substring(0, 100)}..."`);

      return {
        translatedText,
        confidence,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        detectedLanguage: detectedLang,
        processingTime,
        service: 'google-translate-free'
      };

    } catch (error) {
      this.logger.error(`❌ Google Translate failed: ${error.message}`);
      throw new Error(`Google Translate failed: ${error.message}`);
    }
  }

  /**
   * 🎯 DETECCIÓN DE IDIOMA (GRATIS)
   */
  async detectLanguage(text: string) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      const detectedLang = data[2];
      
      // Mapear códigos Google a nuestros idiomas
      const langMap = {
        'es': 'spanish',
        'gn': 'wayuu',
        'qu': 'wayuu' // Quechua como posible detección wayuu
      };

      return {
        language: langMap[detectedLang] || 'unknown',
        confidence: 0.8,
        googleCode: detectedLang,
        text
      };

    } catch (error) {
      this.logger.error(`❌ Language detection failed: ${error.message}`);
      return {
        language: 'unknown',
        confidence: 0,
        error: error.message,
        text
      };
    }
  }

  /**
   * ⚡ BATCH PROCESSING (GRATIS)
   */
  async translateBatch(
    texts: string[],
    sourceLang: 'wayuu' | 'spanish',
    targetLang: 'wayuu' | 'spanish'
  ) {
    this.logger.log(`🚀 Starting Google Translate batch: ${texts.length} texts`);
    
    const results = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const result = await this.translateText(texts[i], sourceLang, targetLang);
        results.push(result);
        
        // Pausa para evitar rate limiting
        if (i < texts.length - 1) {
          await this.sleep(100); // 100ms entre requests
        }
        
        if ((i + 1) % 10 === 0) {
          this.logger.log(`📊 Progress: ${i + 1}/${texts.length} completed`);
        }
        
      } catch (error) {
        this.logger.error(`❌ Failed to translate item ${i}: ${error.message}`);
        results.push({
          error: error.message,
          originalText: texts[i],
          index: i
        });
      }
    }
    
    const successCount = results.filter(r => !r.error).length;
    this.logger.log(`✅ Batch completed: ${successCount}/${texts.length} successful`);
    
    return {
      results,
      totalProcessed: texts.length,
      successCount,
      errorCount: texts.length - successCount
    };
  }

  private calculateBasicConfidence(original: string, translated: string): number {
    // Confianza básica basada en longitud y contenido
    if (!translated || translated === original) return 0.3;
    
    const lengthRatio = Math.min(translated.length / original.length, original.length / translated.length);
    const hasContent = translated.length > 2 && !/^[.!?\s]*$/.test(translated);
    
    return Math.min(0.9, lengthRatio * 0.7 + (hasContent ? 0.2 : 0));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isAvailable(): boolean {
    return true; // Siempre disponible, no requiere API key
  }
} 