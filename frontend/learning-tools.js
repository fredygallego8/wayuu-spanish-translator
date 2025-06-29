/**
 * Herramientas de Aprendizaje Wayuu - Análisis Fonético e Interactivo
 * JavaScript para manejar análisis fonético automatizado y ejercicios de aprendizaje
 */

class WayuuLearningTools {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3002';
        this.currentExercises = [];
        this.currentExerciseIndex = 0;
        this.selectedExerciseType = 'pronunciation';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPhoneticPatterns();
        this.loadLearningProgress();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.id.replace('tab-', ''));
            });
        });

        // Phonetic analysis
        document.getElementById('analyze-btn').addEventListener('click', () => {
            this.analyzePhonetics();
        });

        // Example buttons
        document.querySelectorAll('.example-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const text = e.currentTarget.dataset.text;
                document.getElementById('phonetic-input').value = text;
                this.analyzePhonetics();
            });
        });

        // Exercise type selection
        document.querySelectorAll('.exercise-type-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectExerciseType(e.currentTarget.dataset.type);
            });
        });

        // Exercise generation
        document.getElementById('generate-exercises-btn').addEventListener('click', () => {
            this.generateExercises();
        });

        // Exercise controls
        document.getElementById('prev-exercise-btn').addEventListener('click', () => {
            this.previousExercise();
        });

        document.getElementById('next-exercise-btn').addEventListener('click', () => {
            this.nextExercise();
        });

        document.getElementById('close-exercise-btn').addEventListener('click', () => {
            this.closeExercises();
        });

        document.getElementById('show-hint-btn').addEventListener('click', () => {
            this.showHint();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Update content sections
        document.querySelectorAll('.tab-content').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(`${tabName}-section`).classList.remove('hidden');

        // Load specific content if needed
        if (tabName === 'patterns') {
            this.loadPhoneticPatterns();
        } else if (tabName === 'progress') {
            this.loadLearningProgress();
        }
    }

    async analyzePhonetics() {
        const text = document.getElementById('phonetic-input').value.trim();
        
        if (!text) {
            this.showNotification('Por favor ingresa texto para analizar', 'warning');
            return;
        }

        const includeStress = document.getElementById('include-stress').checked;
        const includeSyllables = document.getElementById('include-syllables').checked;
        const includePhonemes = document.getElementById('include-phonemes').checked;

        try {
            this.showNotification('Analizando fonética...', 'info');

            const response = await fetch(`${this.apiBaseUrl}/api/translation/phonetic-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    includeStressPatterns: includeStress,
                    includeSyllableBreakdown: includeSyllables,
                    includePhonemeMapping: includePhonemes
                })
            });

            if (!response.ok) {
                throw new Error('Error en el análisis fonético');
            }

            const result = await response.json();
            
            if (result.success) {
                this.displayPhoneticResults(result.data);
                this.showNotification('Análisis fonético completado', 'success');
            } else {
                throw new Error(result.message || 'Error en el análisis');
            }

        } catch (error) {
            console.error('Error:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    displayPhoneticResults(analysis) {
        // Show results section
        document.getElementById('phonetic-results').classList.remove('hidden');

        // Display syllables
        if (analysis.syllables) {
            document.getElementById('syllables-display').innerHTML = 
                analysis.syllables.map(syllable => `<span class="mx-1 px-2 py-1 bg-white bg-opacity-20 rounded">${syllable}</span>`).join('');
        }

        // Display stress pattern
        if (analysis.stressPattern) {
            const stressInfo = analysis.stressPattern.map((stress, index) => 
                `Sílaba ${index + 1}: ${stress === 1 ? 'Acentuada' : 'Átona'}`
            ).join(', ');
            document.getElementById('stress-pattern').textContent = stressInfo;
        }

        // Display phonemes
        if (analysis.phonemes) {
            document.getElementById('phonemes-display').innerHTML = 
                analysis.phonemes.map(phoneme => `<span class="inline-block bg-white bg-opacity-20 px-2 py-1 rounded mr-2 mb-1">${phoneme}</span>`).join('');
        }

        // Display difficulty
        if (analysis.difficulty) {
            const difficultyColors = {
                'easy': 'bg-green-100 text-green-800',
                'medium': 'bg-yellow-100 text-yellow-800',
                'hard': 'bg-red-100 text-red-800'
            };
            const difficultyTexts = {
                'easy': 'Fácil',
                'medium': 'Intermedio',
                'hard': 'Difícil'
            };
            
            document.getElementById('difficulty-badge').innerHTML = 
                `<span class="px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[analysis.difficulty]}">
                    Dificultad: ${difficultyTexts[analysis.difficulty]}
                </span>`;
        }

        // Display phoneme mapping
        if (analysis.phonemeMapping) {
            const phonemeCards = analysis.phonemeMapping.map(mapping => `
                <div class="phoneme-card bg-white p-4 rounded-lg shadow-sm border">
                    <div class="text-lg font-bold text-gray-900 mb-2">${mapping.wayuu}</div>
                    <div class="text-sm text-gray-600 mb-1">IPA: <span class="font-mono">${mapping.ipa}</span></div>
                    <div class="text-xs text-gray-500">${mapping.description}</div>
                </div>
            `).join('');
            document.getElementById('phoneme-cards').innerHTML = phonemeCards;
        }

        // Display practice recommendations
        if (analysis.practiceRecommendations) {
            const recommendations = analysis.practiceRecommendations.map(rec => `
                <div class="flex items-start">
                    <i class="fas fa-check-circle text-blue-600 mr-2 mt-1"></i>
                    <span class="text-blue-800">${rec}</span>
                </div>
            `).join('');
            document.getElementById('recommendations-list').innerHTML = recommendations;
        }

        // Display similar sounds
        if (analysis.similarSounds) {
            const similarSounds = analysis.similarSounds.map(sound => `
                <div class="bg-gray-50 p-4 rounded-lg border">
                    <div class="font-medium text-gray-900">${sound}</div>
                    <button class="mt-2 text-sm text-blue-600 hover:text-blue-800">
                        <i class="fas fa-play mr-1"></i>Reproducir
                    </button>
                </div>
            `).join('');
            document.getElementById('similar-sounds-list').innerHTML = similarSounds;
        }
    }

    selectExerciseType(type) {
        this.selectedExerciseType = type;
        
        // Update button states
        document.querySelectorAll('.exercise-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
    }

    async generateExercises() {
        const difficulty = document.getElementById('difficulty-select').value;
        const count = parseInt(document.getElementById('count-select').value);
        const focusWordsInput = document.getElementById('focus-words').value.trim();
        const focusWords = focusWordsInput ? focusWordsInput.split(',').map(w => w.trim()) : undefined;

        try {
            this.showNotification('Generando ejercicios...', 'info');

            const response = await fetch(`${this.apiBaseUrl}/api/translation/learning-exercises`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    exerciseType: this.selectedExerciseType,
                    difficulty: difficulty,
                    count: count,
                    focusWords: focusWords
                })
            });

            if (!response.ok) {
                throw new Error('Error generando ejercicios');
            }

            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                this.currentExercises = result.data;
                this.currentExerciseIndex = 0;
                this.displayExercise();
                this.showNotification(`${result.data.length} ejercicios generados`, 'success');
            } else {
                throw new Error(result.message || 'No se pudieron generar ejercicios');
            }

        } catch (error) {
            console.error('Error:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    displayExercise() {
        if (this.currentExercises.length === 0) return;

        const exercise = this.currentExercises[this.currentExerciseIndex];
        
        // Show exercise display
        document.getElementById('exercise-display').classList.remove('hidden');
        
        // Update title and counter
        document.getElementById('exercise-title').textContent = exercise.title;
        document.getElementById('exercise-counter').textContent = 
            `${this.currentExerciseIndex + 1} de ${this.currentExercises.length}`;

        // Display exercise content based on type
        const contentDiv = document.getElementById('exercise-content');
        
        switch (exercise.type) {
            case 'pronunciation':
                contentDiv.innerHTML = this.renderPronunciationExercise(exercise);
                break;
            case 'listening':
                contentDiv.innerHTML = this.renderListeningExercise(exercise);
                break;
            case 'vocabulary':
                contentDiv.innerHTML = this.renderVocabularyExercise(exercise);
                break;
            case 'pattern-recognition':
                contentDiv.innerHTML = this.renderPatternRecognitionExercise(exercise);
                break;
            default:
                contentDiv.innerHTML = this.renderGenericExercise(exercise);
        }

        // Update navigation buttons
        document.getElementById('prev-exercise-btn').disabled = this.currentExerciseIndex === 0;
        document.getElementById('next-exercise-btn').disabled = this.currentExerciseIndex === this.currentExercises.length - 1;

        // Show/hide hints
        if (exercise.hints && exercise.hints.length > 0) {
            document.getElementById('exercise-hints').classList.remove('hidden');
        } else {
            document.getElementById('exercise-hints').classList.add('hidden');
        }

        // Hide hint display
        document.getElementById('hint-display').classList.add('hidden');
    }

    renderPronunciationExercise(exercise) {
        return `
            <div class="space-y-6">
                <div class="bg-blue-50 p-6 rounded-lg">
                    <h4 class="text-lg font-semibold text-blue-900 mb-2">Palabra a pronunciar:</h4>
                    <div class="text-3xl font-bold text-blue-800 mb-4">${exercise.content.word}</div>
                    <p class="text-blue-700">${exercise.description}</p>
                </div>
                
                ${exercise.content.audioId ? `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-2">Escucha el ejemplo:</p>
                        <audio controls class="w-full">
                            <source src="${this.apiBaseUrl}/api/audio/files/audio_${exercise.content.audioId.toString().padStart(3, '0')}.wav" type="audio/wav">
                            Tu navegador no soporta el elemento de audio.
                        </audio>
                    </div>
                ` : ''}
                
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <p class="text-sm text-yellow-800">
                        <i class="fas fa-microphone mr-2"></i>
                        Usa el micrófono de tu dispositivo para practicar la pronunciación
                    </p>
                </div>
            </div>
        `;
    }

    renderListeningExercise(exercise) {
        return `
            <div class="space-y-6">
                <div class="bg-green-50 p-6 rounded-lg">
                    <h4 class="text-lg font-semibold text-green-900 mb-2">Ejercicio de Comprensión:</h4>
                    <p class="text-green-700 mb-4">${exercise.description}</p>
                    
                    ${exercise.content.audioId ? `
                        <audio controls class="w-full mb-4">
                            <source src="${this.apiBaseUrl}/api/audio/files/audio_${exercise.content.audioId.toString().padStart(3, '0')}.wav" type="audio/wav">
                            Tu navegador no soporta el elemento de audio.
                        </audio>
                    ` : ''}
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        ¿Qué escuchaste? Escribe en Wayuu:
                    </label>
                    <textarea 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        rows="3"
                        placeholder="Escribe aquí lo que escuchaste..."
                    ></textarea>
                </div>
                
                <button class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
                    Verificar Respuesta
                </button>
            </div>
        `;
    }

    renderVocabularyExercise(exercise) {
        return `
            <div class="space-y-6">
                <div class="bg-purple-50 p-6 rounded-lg">
                    <h4 class="text-lg font-semibold text-purple-900 mb-2">Aprende esta palabra:</h4>
                    <div class="text-2xl font-bold text-purple-800 mb-2">${exercise.content.wayuuWord}</div>
                    <div class="text-lg text-purple-700 mb-4">Español: ${exercise.content.spanishTranslation}</div>
                    <p class="text-purple-600">${exercise.content.context}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${exercise.content.options.map((option, index) => `
                        <button class="option-btn p-4 text-left border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors" data-option="${index}">
                            <div class="font-medium">${option.text}</div>
                            <div class="text-sm text-gray-600">${option.translation}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderPatternRecognitionExercise(exercise) {
        return `
            <div class="space-y-6">
                <div class="bg-yellow-50 p-6 rounded-lg">
                    <h4 class="text-lg font-semibold text-yellow-900 mb-2">Reconoce el patrón:</h4>
                    <p class="text-yellow-700 mb-4">${exercise.description}</p>
                    <div class="text-xl font-mono text-yellow-800">${exercise.content.pattern}</div>
                </div>
                
                <div>
                    <p class="text-sm font-medium text-gray-700 mb-3">¿Cuál de estas palabras sigue el mismo patrón?</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${exercise.content.options.map((option, index) => `
                            <button class="option-btn p-3 text-left border-2 border-gray-200 rounded-lg hover:border-yellow-500 transition-colors" data-option="${index}">
                                ${option}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderGenericExercise(exercise) {
        return `
            <div class="space-y-6">
                <div class="bg-gray-50 p-6 rounded-lg">
                    <p class="text-gray-700">${exercise.description}</p>
                </div>
                <div class="text-center text-gray-500">
                    <i class="fas fa-cog text-4xl mb-4"></i>
                    <p>Ejercicio en desarrollo</p>
                </div>
            </div>
        `;
    }

    previousExercise() {
        if (this.currentExerciseIndex > 0) {
            this.currentExerciseIndex--;
            this.displayExercise();
        }
    }

    nextExercise() {
        if (this.currentExerciseIndex < this.currentExercises.length - 1) {
            this.currentExerciseIndex++;
            this.displayExercise();
        }
    }

    closeExercises() {
        document.getElementById('exercise-display').classList.add('hidden');
        this.currentExercises = [];
        this.currentExerciseIndex = 0;
    }

    showHint() {
        if (this.currentExercises.length === 0) return;
        
        const exercise = this.currentExercises[this.currentExerciseIndex];
        if (exercise.hints && exercise.hints.length > 0) {
            const randomHint = exercise.hints[Math.floor(Math.random() * exercise.hints.length)];
            document.getElementById('hint-text').textContent = randomHint;
            document.getElementById('hint-display').classList.remove('hidden');
        }
    }

    async loadPhoneticPatterns() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/translation/phonetic-patterns`);
            if (!response.ok) throw new Error('Error cargando patrones');
            
            const result = await response.json();
            if (result.success) {
                this.displayPhoneticPatterns(result.data);
            }
        } catch (error) {
            console.error('Error loading patterns:', error);
            document.getElementById('patterns-content').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p class="text-red-600">Error cargando patrones fonéticos</p>
                </div>
            `;
        }
    }

    displayPhoneticPatterns(patterns) {
        const content = `
            <div class="space-y-8">
                <!-- Vowels -->
                <div class="bg-blue-50 rounded-lg p-6">
                    <h3 class="text-xl font-semibold text-blue-900 mb-4">
                        <i class="fas fa-circle mr-2"></i>Vocales
                    </h3>
                    <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
                        ${patterns.vowels.map(vowel => `
                            <div class="bg-blue-100 text-blue-800 p-3 rounded-lg text-center font-mono text-lg">
                                ${vowel}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Consonants -->
                <div class="bg-green-50 rounded-lg p-6">
                    <h3 class="text-xl font-semibold text-green-900 mb-4">
                        <i class="fas fa-square mr-2"></i>Consonantes
                    </h3>
                    <div class="grid grid-cols-4 md:grid-cols-7 gap-3">
                        ${patterns.consonants.map(consonant => `
                            <div class="bg-green-100 text-green-800 p-3 rounded-lg text-center font-mono">
                                ${consonant}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Special Characters -->
                <div class="bg-purple-50 rounded-lg p-6">
                    <h3 class="text-xl font-semibold text-purple-900 mb-4">
                        <i class="fas fa-star mr-2"></i>Caracteres Especiales
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${patterns.specialChars.map(char => `
                            <div class="bg-purple-100 text-purple-800 p-4 rounded-lg text-center">
                                <div class="font-mono text-xl mb-2">${char}</div>
                                <div class="text-sm">Oclusión glotal</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Common Combinations -->
                <div class="bg-yellow-50 rounded-lg p-6">
                    <h3 class="text-xl font-semibold text-yellow-900 mb-4">
                        <i class="fas fa-link mr-2"></i>Combinaciones Comunes
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${patterns.commonCombinations.map(combo => `
                            <div class="bg-yellow-100 p-4 rounded-lg">
                                <div class="font-mono text-lg text-yellow-800 mb-2">${combo.pattern}</div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-yellow-700">Frecuencia: ${combo.frequency}</span>
                                    <span class="text-yellow-700">Dificultad: ${combo.difficulty}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Stress Patterns -->
                <div class="bg-red-50 rounded-lg p-6">
                    <h3 class="text-xl font-semibold text-red-900 mb-4">
                        <i class="fas fa-chart-bar mr-2"></i>Patrones de Acento
                    </h3>
                    <div class="space-y-3">
                        ${patterns.stressPatterns.map(pattern => `
                            <div class="bg-red-100 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <div class="font-semibold text-red-800">${pattern.type}</div>
                                    <div class="text-red-700 text-sm">${pattern.description}</div>
                                </div>
                                <div class="text-red-600 text-sm">
                                    Frecuencia: ${pattern.frequency}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('patterns-content').innerHTML = content;
    }

    async loadLearningProgress() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/translation/learning-progress`);
            if (!response.ok) throw new Error('Error cargando progreso');
            
            const result = await response.json();
            if (result.success) {
                this.displayLearningProgress(result.data);
            }
        } catch (error) {
            console.error('Error loading progress:', error);
            document.getElementById('progress-content').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p class="text-red-600">Error cargando progreso de aprendizaje</p>
                </div>
            `;
        }
    }

    displayLearningProgress(progress) {
        const content = `
            <div class="space-y-8">
                <!-- User Info -->
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
                    <h3 class="text-2xl font-bold mb-2">¡Hola, ${progress.userId}!</h3>
                    <p class="text-blue-100">Nivel actual: <span class="font-semibold">${progress.currentLevel}</span></p>
                </div>

                <!-- Progress Overview -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    ${Object.entries(progress.completedExercises).map(([type, count]) => `
                        <div class="bg-white p-6 rounded-lg shadow-sm border">
                            <div class="text-center">
                                <div class="text-3xl font-bold text-gray-900 mb-2">${count}</div>
                                <div class="text-sm text-gray-600 capitalize">${type.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Strengths and Weaknesses -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-green-50 rounded-lg p-6">
                        <h4 class="text-lg font-semibold text-green-900 mb-4">
                            <i class="fas fa-thumbs-up mr-2"></i>Fortalezas
                        </h4>
                        <ul class="space-y-2">
                            ${progress.strengths.map(strength => `
                                <li class="flex items-center text-green-700">
                                    <i class="fas fa-check-circle mr-2"></i>
                                    ${strength}
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div class="bg-orange-50 rounded-lg p-6">
                        <h4 class="text-lg font-semibold text-orange-900 mb-4">
                            <i class="fas fa-target mr-2"></i>Áreas de Mejora
                        </h4>
                        <ul class="space-y-2">
                            ${progress.weaknesses.map(weakness => `
                                <li class="flex items-center text-orange-700">
                                    <i class="fas fa-exclamation-circle mr-2"></i>
                                    ${weakness}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>

                <!-- Recommendations -->
                <div class="bg-blue-50 rounded-lg p-6">
                    <h4 class="text-lg font-semibold text-blue-900 mb-4">
                        <i class="fas fa-lightbulb mr-2"></i>Recomendaciones Personalizadas
                    </h4>
                    <div class="space-y-3">
                        ${progress.recommendations.map(rec => `
                            <div class="flex items-start">
                                <i class="fas fa-arrow-right text-blue-600 mr-3 mt-1"></i>
                                <span class="text-blue-800">${rec}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Next Exercises -->
                <div class="bg-purple-50 rounded-lg p-6">
                    <h4 class="text-lg font-semibold text-purple-900 mb-4">
                        <i class="fas fa-play-circle mr-2"></i>Próximos Ejercicios Recomendados
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${progress.nextExercises.map(exercise => `
                            <div class="bg-purple-100 p-4 rounded-lg">
                                <div class="font-semibold text-purple-800 capitalize">${exercise.type}</div>
                                <div class="text-sm text-purple-700">Dificultad: ${exercise.difficulty}</div>
                                <div class="text-sm text-purple-600">Enfoque: ${exercise.focus}</div>
                                <button class="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
                                    Comenzar
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('progress-content').innerHTML = content;
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        notification.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg mb-4 flex items-center`;
        notification.innerHTML = `
            <i class="${icons[type]} mr-3"></i>
            <span>${message}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the learning tools when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WayuuLearningTools();
}); 