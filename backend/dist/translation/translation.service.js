"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TranslationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationService = void 0;
const common_1 = require("@nestjs/common");
const translate_dto_1 = require("./dto/translate.dto");
const datasets_service_1 = require("../datasets/datasets.service");
const metrics_service_1 = require("../metrics/metrics.service");
let TranslationService = TranslationService_1 = class TranslationService {
    constructor(datasetsService, metricsService) {
        this.datasetsService = datasetsService;
        this.metricsService = metricsService;
        this.logger = new common_1.Logger(TranslationService_1.name);
        this.wayuuPhonemes = {
            vowels: ['a', 'e', 'i', 'o', 'u', 'ü'],
            consonants: ['ch', 'j', 'k', 'l', 'm', 'n', 'ñ', 'p', 'r', 's', 'sh', 't', 'w', 'y'],
            specialChars: ['ꞌ', '̈'],
            stressMarkers: ['́', '̀']
        };
        this.wayuuPhonemeMapping = [
            { wayuu: 'ch', ipa: 'tʃ', description: 'Consonante africada sorda' },
            { wayuu: 'j', ipa: 'x', description: 'Consonante fricativa velar sorda' },
            { wayuu: 'k', ipa: 'k', description: 'Consonante oclusiva velar sorda' },
            { wayuu: 'ñ', ipa: 'ɲ', description: 'Consonante nasal palatal' },
            { wayuu: 'sh', ipa: 'ʃ', description: 'Consonante fricativa postalveolar sorda' },
            { wayuu: 'ü', ipa: 'ɨ', description: 'Vocal central alta' },
            { wayuu: 'ꞌ', ipa: 'ʔ', description: 'Oclusión glotal' }
        ];
    }
    async translate(translateDto) {
        const { text, direction, preferredDataset, includePhoneticAnalysis, includeLearningHints } = translateDto;
        const startTime = Date.now();
        this.logger.log(`Translating text: "${text}" - Direction: ${direction}`);
        const sourceLang = direction === translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH ? 'wayuu' : 'spanish';
        const targetLang = direction === translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH ? 'spanish' : 'wayuu';
        try {
            const translation = await this.findTranslation(text, direction, preferredDataset);
            if (!translation) {
                const duration = (Date.now() - startTime) / 1000;
                this.metricsService.incrementTranslation(direction, sourceLang, targetLang, 'fallback');
                this.metricsService.recordTranslationDuration(direction, sourceLang, targetLang, duration);
                return this.generateFallbackTranslation(text, direction);
            }
            const response = {
                originalText: text,
                translatedText: translation.translatedText,
                direction,
                confidence: translation.confidence,
                sourceDataset: translation.sourceDataset,
                alternatives: translation.alternatives,
                contextInfo: translation.contextInfo,
            };
            if (includePhoneticAnalysis && direction === translate_dto_1.TranslationDirection.SPANISH_TO_WAYUU) {
                response.phoneticAnalysis = await this.analyzePhonetics({ text: translation.translatedText });
            }
            if (includeLearningHints) {
                response.learningHints = this.generateLearningHints(text, translation.translatedText, direction);
            }
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.incrementTranslation(direction, sourceLang, targetLang, 'success');
            this.metricsService.recordTranslationDuration(direction, sourceLang, targetLang, duration);
            return response;
        }
        catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.incrementTranslationError(error.message || 'unknown_error', direction);
            this.metricsService.recordTranslationDuration(direction, sourceLang, targetLang, duration);
            this.logger.error(`Translation error: ${error.message}`);
            throw new common_1.BadRequestException('Translation failed');
        }
    }
    async analyzePhonetics(phoneticDto) {
        const { text } = phoneticDto;
        this.logger.log(`Analyzing phonetics for: "${text}"`);
        const syllables = this.breakIntoSyllables(text);
        const stressPattern = this.analyzeStressPattern(syllables);
        const phonemes = this.extractPhonemes(text);
        const phonemeMapping = this.mapPhonemes(phonemes);
        const difficulty = this.assessPronunciationDifficulty(phonemes);
        const similarSounds = await this.findSimilarSounds(text);
        const practiceRecommendations = this.generatePracticeRecommendations(phonemes, difficulty);
        return {
            text,
            syllables,
            stressPattern,
            phonemes,
            phonemeMapping,
            difficulty,
            similarSounds,
            practiceRecommendations
        };
    }
    async generateLearningExercise(exerciseDto) {
        const { exerciseType, difficulty = 'beginner', count = 5, focusWords } = exerciseDto;
        this.logger.log(`Generating ${count} ${exerciseType} exercises at ${difficulty} level`);
        const exercises = [];
        switch (exerciseType) {
            case 'pronunciation':
                return this.generatePronunciationExercises(difficulty, count, focusWords);
            case 'listening':
                return this.generateListeningExercises(difficulty, count);
            case 'pattern-recognition':
                return this.generatePatternRecognitionExercises(difficulty, count);
            case 'vocabulary':
                return this.generateVocabularyExercises(difficulty, count, focusWords);
            default:
                throw new common_1.BadRequestException(`Unknown exercise type: ${exerciseType}`);
        }
    }
    breakIntoSyllables(text) {
        const words = text.toLowerCase().split(' ');
        const allSyllables = [];
        for (const word of words) {
            const syllables = word.split(/([aeiouü])/g).filter(s => s.length > 0);
            let currentSyllable = '';
            for (let i = 0; i < syllables.length; i++) {
                currentSyllable += syllables[i];
                if (/[aeiouü]/.test(currentSyllable) &&
                    i + 1 < syllables.length &&
                    /^[^aeiouü]/.test(syllables[i + 1])) {
                    allSyllables.push(currentSyllable);
                    currentSyllable = '';
                }
            }
            if (currentSyllable) {
                allSyllables.push(currentSyllable);
            }
        }
        return allSyllables;
    }
    analyzeStressPattern(syllables) {
        const pattern = [];
        for (let i = 0; i < syllables.length; i++) {
            const syllable = syllables[i];
            if (syllable.includes('́') || syllable.includes('̀')) {
                pattern.push(1);
            }
            else if (i === syllables.length - 2 && syllables.length > 1) {
                pattern.push(1);
            }
            else {
                pattern.push(0);
            }
        }
        return pattern;
    }
    extractPhonemes(text) {
        const phonemes = [];
        const normalizedText = text.toLowerCase();
        let i = 0;
        while (i < normalizedText.length) {
            if (i < normalizedText.length - 1) {
                const digraph = normalizedText.substring(i, i + 2);
                if (['ch', 'sh'].includes(digraph)) {
                    phonemes.push(digraph);
                    i += 2;
                    continue;
                }
            }
            const char = normalizedText[i];
            if (this.wayuuPhonemes.vowels.includes(char) ||
                this.wayuuPhonemes.consonants.includes(char) ||
                this.wayuuPhonemes.specialChars.includes(char)) {
                phonemes.push(char);
            }
            i++;
        }
        return phonemes;
    }
    mapPhonemes(phonemes) {
        return phonemes
            .filter((phoneme, index, array) => array.indexOf(phoneme) === index)
            .map(phoneme => {
            const mapping = this.wayuuPhonemeMapping.find(m => m.wayuu === phoneme);
            return mapping || {
                wayuu: phoneme,
                ipa: phoneme,
                description: 'Sonido estándar'
            };
        });
    }
    assessPronunciationDifficulty(phonemes) {
        const difficultPhonemes = ['ꞌ', 'ü', 'ch', 'sh', 'j'];
        const difficultCount = phonemes.filter(p => difficultPhonemes.includes(p)).length;
        if (difficultCount === 0)
            return 'easy';
        if (difficultCount <= 2)
            return 'medium';
        return 'hard';
    }
    async findSimilarSounds(text) {
        const audioData = await this.datasetsService.getAudioEntries();
        const audioEntries = audioData.entries || [];
        const textPhonemes = this.extractPhonemes(text);
        const similarEntries = audioEntries
            .filter(entry => {
            const entryPhonemes = this.extractPhonemes(entry.transcription);
            const commonPhonemes = textPhonemes.filter(p => entryPhonemes.includes(p));
            return commonPhonemes.length >= Math.min(3, textPhonemes.length * 0.6);
        })
            .slice(0, 5)
            .map(entry => entry.transcription);
        return similarEntries;
    }
    generatePracticeRecommendations(phonemes, difficulty) {
        const recommendations = [];
        if (phonemes.includes('ꞌ')) {
            recommendations.push('Practica la oclusión glotal (ꞌ) haciendo una pausa breve en la garganta');
        }
        if (phonemes.includes('ü')) {
            recommendations.push('La vocal ü se pronuncia como una "i" más relajada, en posición central');
        }
        if (phonemes.includes('ch') || phonemes.includes('sh')) {
            recommendations.push('Practica las consonantes africadas y fricativas con ejercicios de repetición');
        }
        if (difficulty === 'hard') {
            recommendations.push('Esta palabra contiene sonidos complejos. Practica lentamente y repite varias veces');
        }
        return recommendations;
    }
    async generatePronunciationExercises(difficulty, count, focusWords) {
        const exercises = [];
        const audioData = await this.datasetsService.getAudioEntries();
        const audioEntries = audioData.entries || [];
        let filteredEntries = audioEntries.filter(entry => {
            const phonemes = this.extractPhonemes(entry.transcription);
            const entryDifficulty = this.assessPronunciationDifficulty(phonemes);
            switch (difficulty) {
                case 'beginner': return entryDifficulty === 'easy';
                case 'intermediate': return entryDifficulty === 'medium';
                case 'advanced': return entryDifficulty === 'hard';
                default: return true;
            }
        });
        if (focusWords && focusWords.length > 0) {
            filteredEntries = filteredEntries.filter(entry => focusWords.some(word => entry.transcription.toLowerCase().includes(word.toLowerCase())));
        }
        for (let i = 0; i < Math.min(count, filteredEntries.length); i++) {
            const entry = filteredEntries[i];
            const phoneticAnalysis = await this.analyzePhonetics({ text: entry.transcription });
            exercises.push({
                id: `pronunciation_${i + 1}`,
                type: 'pronunciation',
                difficulty,
                title: `Pronunciación: ${entry.transcription}`,
                description: 'Escucha el audio y practica la pronunciación de esta frase en Wayuu',
                content: {
                    text: entry.transcription,
                    phoneticAnalysis,
                    audioId: entry.id
                },
                hints: phoneticAnalysis.practiceRecommendations,
                audioId: entry.id
            });
        }
        return exercises;
    }
    async generateListeningExercises(difficulty, count) {
        const exercises = [];
        const audioData = await this.datasetsService.getAudioEntries();
        const audioEntries = audioData.entries || [];
        for (let i = 0; i < Math.min(count, audioEntries.length); i++) {
            const entry = audioEntries[i];
            exercises.push({
                id: `listening_${i + 1}`,
                type: 'listening',
                difficulty,
                title: 'Ejercicio de Comprensión Auditiva',
                description: 'Escucha el audio y escribe lo que oyes en Wayuu',
                content: {
                    audioId: entry.id,
                    instruction: 'Escucha cuidadosamente y transcribe el texto en Wayuu'
                },
                expectedAnswer: entry.transcription,
                hints: [
                    'Escucha varias veces si es necesario',
                    'Presta atención a los sonidos especiales del Wayuu',
                    'Divide la frase en partes más pequeñas'
                ],
                audioId: entry.id
            });
        }
        return exercises;
    }
    async generatePatternRecognitionExercises(difficulty, count) {
        const exercises = [];
        const audioData = await this.datasetsService.getAudioEntries();
        const audioEntries = audioData.entries || [];
        const patternGroups = new Map();
        for (const entry of audioEntries) {
            const phonemes = this.extractPhonemes(entry.transcription);
            const key = phonemes.slice(0, 3).join('-');
            if (!patternGroups.has(key)) {
                patternGroups.set(key, []);
            }
            patternGroups.get(key).push(entry);
        }
        let exerciseCount = 0;
        for (const [pattern, entries] of patternGroups) {
            if (exerciseCount >= count)
                break;
            if (entries.length < 2)
                continue;
            const correctEntry = entries[0];
            const distractors = entries.slice(1, 4);
            exercises.push({
                id: `pattern_${exerciseCount + 1}`,
                type: 'pattern-recognition',
                difficulty,
                title: `Reconocimiento de Patrones Fonéticos`,
                description: 'Identifica cuál de las siguientes opciones tiene el mismo patrón fonético',
                content: {
                    targetAudio: correctEntry.id,
                    options: [correctEntry, ...distractors].map(e => ({
                        id: e.id,
                        text: e.transcription
                    }))
                },
                expectedAnswer: correctEntry.id,
                hints: [
                    'Escucha el patrón de sonidos al inicio de cada palabra',
                    'Presta atención a las consonantes y vocales',
                    'Compara los ritmos y acentos'
                ]
            });
            exerciseCount++;
        }
        return exercises;
    }
    async generateVocabularyExercises(difficulty, count, focusWords) {
        const exercises = [];
        await this.datasetsService.loadWayuuDictionary();
        const allEntries = await this.datasetsService.getDatasetInfo();
        const dictionaryEntries = allEntries.entries || [];
        let filteredEntries = dictionaryEntries;
        if (focusWords && focusWords.length > 0) {
            filteredEntries = dictionaryEntries.filter(entry => focusWords.some(word => entry.guc.toLowerCase().includes(word.toLowerCase()) ||
                entry.spa.toLowerCase().includes(word.toLowerCase())));
        }
        for (let i = 0; i < Math.min(count, filteredEntries.length); i++) {
            const entry = filteredEntries[i];
            const wrongOptions = dictionaryEntries
                .filter(e => e.guc !== entry.guc)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(e => e.spa);
            const options = [entry.spa, ...wrongOptions].sort(() => Math.random() - 0.5);
            exercises.push({
                id: `vocabulary_${i + 1}`,
                type: 'vocabulary',
                difficulty,
                title: `Vocabulario: ${entry.guc}`,
                description: '¿Cuál es la traducción correcta de esta palabra Wayuu?',
                content: {
                    wayuuWord: entry.guc,
                    options: options,
                    context: 'Palabra del vocabulario Wayuu'
                },
                expectedAnswer: entry.spa,
                hints: [
                    'Piensa en el contexto de la palabra',
                    'Recuerda las raíces comunes en Wayuu',
                    'Considera el significado más directo'
                ]
            });
        }
        return exercises;
    }
    generateLearningHints(originalText, translatedText, direction) {
        const hints = [];
        if (direction === translate_dto_1.TranslationDirection.SPANISH_TO_WAYUU) {
            const phonemes = this.extractPhonemes(translatedText);
            if (phonemes.includes('ꞌ')) {
                hints.push('Esta palabra contiene una oclusión glotal (ꞌ) - haz una pausa breve');
            }
            if (phonemes.includes('ü')) {
                hints.push('La vocal ü se pronuncia como una "i" central relajada');
            }
            if (translatedText.includes('Maleiwa')) {
                hints.push('Maleiwa es el nombre del Creador en la cosmogonía Wayuu');
            }
        }
        else {
            if (originalText.includes('wayuu')) {
                hints.push('Wayuu significa "persona" y es el nombre del pueblo indígena');
            }
        }
        return hints;
    }
    async findTranslation(text, direction, preferredDataset) {
        const exactMatch = await this.datasetsService.findExactMatch(text, direction, preferredDataset);
        if (exactMatch) {
            this.metricsService.incrementDictionaryLookup('exact_match', true);
            return exactMatch;
        }
        const fuzzyMatch = await this.datasetsService.findFuzzyMatch(text, direction, preferredDataset);
        if (fuzzyMatch) {
            this.metricsService.incrementDictionaryLookup('fuzzy_match', true);
            return fuzzyMatch;
        }
        this.metricsService.incrementDictionaryLookup('no_match', false);
        return null;
    }
    generateFallbackTranslation(text, direction) {
        return {
            originalText: text,
            translatedText: direction === translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH
                ? `[Translation not found for: ${text}]`
                : `[Traducción no encontrada para: ${text}]`,
            direction,
            confidence: 0.1,
            sourceDataset: 'fallback',
            contextInfo: 'Translation not found in available datasets. Consider adding this phrase to improve the translator.',
        };
    }
    async getHealthStatus() {
        const datasets = await this.datasetsService.getLoadedDatasets();
        return {
            status: 'healthy',
            datasets,
        };
    }
    async getAvailableDatasets() {
        return this.datasetsService.getDatasetInfo();
    }
};
exports.TranslationService = TranslationService;
exports.TranslationService = TranslationService = TranslationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [datasets_service_1.DatasetsService,
        metrics_service_1.MetricsService])
], TranslationService);
//# sourceMappingURL=translation.service.js.map