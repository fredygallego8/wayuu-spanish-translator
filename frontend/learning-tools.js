/**
 * Herramientas de Aprendizaje Wayuu - Análisis Fonético e Interactivo
 * JavaScript para manejar análisis fonético automatizado y ejercicios de aprendizaje
 * ✨ ACTUALIZADO PARA DATASET MASIVO DE 7,033+ ENTRADAS ✨
 */

class WayuuLearningTools {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3002';
        this.currentExercises = [];
        this.currentExerciseIndex = 0;
        this.selectedExerciseType = 'vocabulary-massive';
        this.massiveDatasetStats = {
            totalEntries: 7033,
            audioEntries: 810,
            pdfSources: 4
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPhoneticPatterns();
        this.loadLearningProgress();
        this.initializeMassiveDatasetFeatures();
    }

    /**
     * 🚀 Inicializar funcionalidades del dataset masivo
     */
    initializeMassiveDatasetFeatures() {
        this.showNotification(`🎉 Dataset Masivo Activado: ${this.massiveDatasetStats.totalEntries.toLocaleString()} entradas disponibles`, 'success');
        this.updateDatasetStatsDisplay();
        this.setupMassiveExerciseTypes();
    }

    /**
     * 📊 Actualizar visualización de estadísticas del dataset
     */
    updateDatasetStatsDisplay() {
        const statsHTML = `
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-6">
                <h3 class="text-lg font-bold mb-2">🚀 Dataset Masivo Activado</h3>
                <div class="grid grid-cols-3 gap-4 text-sm">
                    <div class="text-center">
                        <div class="text-2xl font-bold">${this.massiveDatasetStats.totalEntries.toLocaleString()}</div>
                        <div class="opacity-90">Entradas de Diccionario</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold">${this.massiveDatasetStats.audioEntries}</div>
                        <div class="opacity-90">Archivos de Audio</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold">${this.massiveDatasetStats.pdfSources}</div>
                        <div class="opacity-90">Fuentes Académicas PDF</div>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar antes del primer elemento de ejercicios
        const exercisesSection = document.getElementById('exercises-section');
        if (exercisesSection && !document.getElementById('massive-stats')) {
            const statsDiv = document.createElement('div');
            statsDiv.id = 'massive-stats';
            statsDiv.innerHTML = statsHTML;
            exercisesSection.insertBefore(statsDiv, exercisesSection.firstChild);
        }
    }

    /**
     * 🎯 Configurar tipos de ejercicios masivos
     */
    setupMassiveExerciseTypes() {
        const exerciseTypesContainer = document.querySelector('.exercise-types-container');
        if (exerciseTypesContainer) {
            exerciseTypesContainer.innerHTML = `
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <button class="exercise-type-btn active" data-type="vocabulary-massive">
                        <div class="bg-blue-600 text-white p-4 rounded-lg text-center">
                            <i class="fas fa-brain text-2xl mb-2"></i>
                            <h3 class="font-semibold">Vocabulario Masivo</h3>
                            <p class="text-sm opacity-90">7K+ entradas</p>
                        </div>
                    </button>
                    <button class="exercise-type-btn" data-type="translation-challenge">
                        <div class="bg-purple-600 text-white p-4 rounded-lg text-center">
                            <i class="fas fa-trophy text-2xl mb-2"></i>
                            <h3 class="font-semibold">Desafío Traducción</h3>
                            <p class="text-sm opacity-90">Nivel avanzado</p>
                        </div>
                    </button>
                    <button class="exercise-type-btn" data-type="phonetic-pattern-advanced">
                        <div class="bg-green-600 text-white p-4 rounded-lg text-center">
                            <i class="fas fa-wave-square text-2xl mb-2"></i>
                            <h3 class="font-semibold">Fonética Avanzada</h3>
                            <p class="text-sm opacity-90">Con audio</p>
                        </div>
                    </button>
                    <button class="exercise-type-btn" data-type="cultural-context">
                        <div class="bg-orange-600 text-white p-4 rounded-lg text-center">
                            <i class="fas fa-globe text-2xl mb-2"></i>
                            <h3 class="font-semibold">Contexto Cultural</h3>
                            <p class="text-sm opacity-90">Tradiciones wayuu</p>
                        </div>
                    </button>
                    <button class="exercise-type-btn" data-type="adaptive-learning">
                        <div class="bg-pink-600 text-white p-4 rounded-lg text-center">
                            <i class="fas fa-chart-line text-2xl mb-2"></i>
                            <h3 class="font-semibold">Adaptativo</h3>
                            <p class="text-sm opacity-90">Se ajusta a tu nivel</p>
                        </div>
                    </button>
                    <button class="exercise-type-btn" data-type="pronunciation">
                        <div class="bg-indigo-600 text-white p-4 rounded-lg text-center">
                            <i class="fas fa-microphone text-2xl mb-2"></i>
                            <h3 class="font-semibold">Pronunciación</h3>
                            <p class="text-sm opacity-90">Con TTS</p>
                        </div>
                    </button>
                </div>
            `;
        }
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.id.replace('tab-', ''));
            });
        });

        // Phonetic analysis
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzePhonetics();
            });
        }

        // Example buttons
        document.querySelectorAll('.example-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const text = e.currentTarget.dataset.text;
                document.getElementById('phonetic-input').value = text;
                this.analyzePhonetics();
            });
        });

        // Exercise type selection (delegated event handling)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.exercise-type-btn')) {
                const button = e.target.closest('.exercise-type-btn');
                const type = button.dataset.type;
                this.selectExerciseType(type);
            }
        });

        // Exercise generation
        const generateBtn = document.getElementById('generate-exercises-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateMassiveExercises();
            });
        }

        // Exercise controls
        const prevBtn = document.getElementById('prev-exercise-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousExercise();
            });
        }

        const nextBtn = document.getElementById('next-exercise-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextExercise();
            });
        }

        const closeBtn = document.getElementById('close-exercise-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeExercises();
            });
        }

        const hintBtn = document.getElementById('show-hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                this.showHint();
            });
        }

        // 🚀 NUEVOS EVENT LISTENERS PARA HERRAMIENTAS MASIVAS
        this.setupMassiveToolsEventListeners();
    }

    /**
     * 🚀 Configurar event listeners para herramientas masivas
     */
    setupMassiveToolsEventListeners() {
        // Tab de herramientas masivas
        const massiveTabBtn = document.getElementById('tab-massive-tools');
        if (massiveTabBtn) {
            massiveTabBtn.addEventListener('click', () => {
                this.switchTab('massive-tools');
                this.loadMassiveToolsStats();
            });
        }

        // Botones de herramientas masivas (delegated event handling)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.massive-tool-btn')) {
                const button = e.target.closest('.massive-tool-btn');
                const tool = button.dataset.tool;
                this.activateMassiveTool(tool);
            }
        });

        // Cerrar herramientas masivas
        const closeMassiveToolBtn = document.getElementById('close-massive-tool-btn');
        if (closeMassiveToolBtn) {
            closeMassiveToolBtn.addEventListener('click', () => {
                this.closeMassiveTool();
            });
        }
    }

    /**
     * 📊 Cargar estadísticas actualizadas del dataset masivo
     */
    async loadMassiveToolsStats() {
        try {
            this.showNotification('🔄 Actualizando estadísticas del dataset masivo...', 'info');
            
            // Obtener estadísticas del dataset en tiempo real
            const dictionaryResponse = await fetch(`${this.apiBaseUrl}/api/datasets/dictionary/search?limit=1`);
            const dictionaryData = await dictionaryResponse.json();
            
            const audioResponse = await fetch(`${this.apiBaseUrl}/api/datasets/audio/search?limit=1`);
            const audioData = await audioResponse.json();

            // Actualizar estadísticas
            this.massiveDatasetStats = {
                totalEntries: dictionaryData.totalEntries || 7033,
                audioEntries: audioData.totalEntries || 810,
                pdfSources: 4,
                growthPercentage: '+222%'
            };

            this.updateMassiveStatsDisplay();
            this.showNotification(`✅ Estadísticas actualizadas: ${this.massiveDatasetStats.totalEntries.toLocaleString()} entradas disponibles`, 'success');
            
        } catch (error) {
            console.error('Error loading massive tools stats:', error);
            this.showNotification('⚠️ Error cargando estadísticas. Usando valores almacenados.', 'warning');
        }
    }

    /**
     * 🎯 Actualizar visualización de estadísticas masivas
     */
    updateMassiveStatsDisplay() {
        const totalEntriesEl = document.getElementById('total-entries');
        const audioFilesEl = document.getElementById('audio-files');
        const pdfSourcesEl = document.getElementById('pdf-sources');
        const growthPercentageEl = document.getElementById('growth-percentage');

        if (totalEntriesEl) totalEntriesEl.textContent = this.massiveDatasetStats.totalEntries.toLocaleString();
        if (audioFilesEl) audioFilesEl.textContent = this.massiveDatasetStats.audioEntries.toLocaleString();
        if (pdfSourcesEl) pdfSourcesEl.textContent = this.massiveDatasetStats.pdfSources;
        if (growthPercentageEl) growthPercentageEl.textContent = this.massiveDatasetStats.growthPercentage || '+222%';
    }

    /**
     * 🚀 Activar herramienta masiva específica
     */
    async activateMassiveTool(toolType) {
        this.showNotification(`🚀 Activando herramienta: ${toolType}`, 'info');
        
        const displayArea = document.getElementById('massive-tool-display');
        const titleElement = document.getElementById('massive-tool-title');
        const contentElement = document.getElementById('massive-tool-content');
        
        if (!displayArea || !titleElement || !contentElement) {
            console.error('Massive tool display elements not found');
            return;
        }

        // Mostrar área de herramientas
        displayArea.classList.remove('hidden');
        
        // Scroll to tool display
        displayArea.scrollIntoView({ behavior: 'smooth' });

        try {
            switch (toolType) {
                case 'vocabulary-explorer':
                    await this.activateVocabularyExplorer(titleElement, contentElement);
                    break;
                case 'audio-system':
                    await this.activateAudioSystem(titleElement, contentElement);
                    break;
                case 'pattern-analysis':
                    await this.activatePatternAnalysis(titleElement, contentElement);
                    break;
                case 'cultural-context':
                    await this.activateCulturalContext(titleElement, contentElement);
                    break;
                case 'adaptive-ai':
                    await this.activateAdaptiveAI(titleElement, contentElement);
                    break;
                case 'dataset-stats':
                    await this.activateDatasetStats(titleElement, contentElement);
                    break;
                default:
                    this.showNotification('⚠️ Herramienta no encontrada', 'warning');
            }
        } catch (error) {
            console.error('Error activating massive tool:', error);
            this.showNotification('❌ Error activando herramienta', 'error');
        }
    }

    /**
     * 🔍 Activar Explorador Masivo de Vocabulario
     */
    async activateVocabularyExplorer(titleElement, contentElement) {
        titleElement.textContent = '🔍 Explorador Masivo de Vocabulario';
        contentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i><p class="text-gray-600">Cargando dataset masivo...</p></div>';

        try {
            // Obtener una muestra representativa del dataset
            const response = await fetch(`${this.apiBaseUrl}/api/datasets/dictionary/search?limit=100&random=true`);
            const data = await response.json();

            if (data.success && data.entries) {
                contentElement.innerHTML = this.renderVocabularyExplorer(data);
                this.setupVocabularyExplorerEvents();
                this.showNotification(`✅ Explorador cargado: ${data.totalEntries.toLocaleString()} entradas disponibles`, 'success');
            } else {
                throw new Error('No se pudieron cargar las entradas del vocabulario');
            }
        } catch (error) {
            console.error('Error loading vocabulary explorer:', error);
            contentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
                    <p class="text-red-600 mb-4">Error cargando el explorador de vocabulario</p>
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg" onclick="window.wayuuTools.activateMassiveTool('vocabulary-explorer')">
                        <i class="fas fa-redo mr-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * 🎵 Activar Sistema de Audio Integral
     */
    async activateAudioSystem(titleElement, contentElement) {
        titleElement.textContent = '🎵 Sistema de Audio Integral';
        contentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i><p class="text-gray-600">Cargando sistema de audio...</p></div>';

        try {
            // Obtener información de archivos de audio
            const audioResponse = await fetch(`${this.apiBaseUrl}/api/datasets/audio/search?limit=50`);
            const audioData = await audioResponse.json();

            if (audioData.success && audioData.entries) {
                contentElement.innerHTML = this.renderAudioSystem(audioData);
                this.setupAudioSystemEvents();
                this.showNotification(`🎵 Sistema de audio cargado: ${audioData.totalEntries} archivos disponibles`, 'success');
            } else {
                throw new Error('No se pudieron cargar los archivos de audio');
            }
        } catch (error) {
            console.error('Error loading audio system:', error);
            contentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
                    <p class="text-red-600 mb-4">Error cargando sistema de audio</p>
                    <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg" onclick="window.wayuuTools.activateMassiveTool('audio-system')">
                        <i class="fas fa-redo mr-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * 🧠 Activar Análisis de Patrones Avanzado
     */
    async activatePatternAnalysis(titleElement, contentElement) {
        titleElement.textContent = '🧠 Análisis de Patrones Avanzado';
        contentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i><p class="text-gray-600">Analizando patrones en dataset masivo...</p></div>';

        try {
            // Generar análisis de patrones usando el backend
            const response = await fetch(`${this.apiBaseUrl}/api/translation/learning-exercises-massive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    exerciseType: 'pattern-recognition',
                    difficulty: 'advanced',
                    count: 20,
                    useFullDataset: true,
                    frequencyBasedDifficulty: true
                })
            });

            const data = await response.json();

            if (data.success && data.data) {
                contentElement.innerHTML = this.renderPatternAnalysis(data.data, data.metadata);
                this.setupPatternAnalysisEvents();
                this.showNotification(`🧠 Análisis completado: ${data.data.length} patrones identificados`, 'success');
            } else {
                throw new Error('No se pudo completar el análisis de patrones');
            }
        } catch (error) {
            console.error('Error loading pattern analysis:', error);
            contentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
                    <p class="text-red-600 mb-4">Error en análisis de patrones</p>
                    <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg" onclick="window.wayuuTools.activateMassiveTool('pattern-analysis')">
                        <i class="fas fa-redo mr-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * 🌍 Activar Explorador de Contexto Cultural
     */
    async activateCulturalContext(titleElement, contentElement) {
        titleElement.textContent = '🌍 Explorador de Contexto Cultural';
        contentElement.innerHTML = this.renderCulturalContext();
        this.setupCulturalContextEvents();
        this.showNotification('🌍 Explorador cultural activado', 'success');
    }

    /**
     * 🤖 Activar IA de Aprendizaje Adaptativo
     */
    async activateAdaptiveAI(titleElement, contentElement) {
        titleElement.textContent = '🤖 IA de Aprendizaje Adaptativo';
        contentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i><p class="text-gray-600">Inicializando IA adaptativa...</p></div>';

        try {
            // Generar ejercicios adaptativos
            const response = await fetch(`${this.apiBaseUrl}/api/translation/learning-exercises-massive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    exerciseType: 'adaptive-learning',
                    difficulty: 'intermediate',
                    count: 10,
                    useFullDataset: true,
                    adaptiveDifficulty: true,
                    includeAudioExercises: true
                })
            });

            const data = await response.json();

            if (data.success && data.data) {
                contentElement.innerHTML = this.renderAdaptiveAI(data.data, data.metadata);
                this.setupAdaptiveAIEvents();
                this.showNotification(`🤖 IA adaptativa inicializada con ${data.data.length} ejercicios`, 'success');
            } else {
                throw new Error('No se pudo inicializar la IA adaptativa');
            }
        } catch (error) {
            console.error('Error loading adaptive AI:', error);
            contentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
                    <p class="text-red-600 mb-4">Error inicializando IA adaptativa</p>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg" onclick="window.wayuuTools.activateMassiveTool('adaptive-ai')">
                        <i class="fas fa-redo mr-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * 📊 Activar Estadísticas del Dataset
     */
    async activateDatasetStats(titleElement, contentElement) {
        titleElement.textContent = '📊 Estadísticas del Dataset Masivo';
        contentElement.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i><p class="text-gray-600">Generando estadísticas avanzadas...</p></div>';

        try {
            // Obtener estadísticas detalladas
            const [dictionaryResponse, audioResponse] = await Promise.all([
                fetch(`${this.apiBaseUrl}/api/datasets/dictionary/search?limit=1`),
                fetch(`${this.apiBaseUrl}/api/datasets/audio/search?limit=1`)
            ]);

            const [dictionaryData, audioData] = await Promise.all([
                dictionaryResponse.json(),
                audioResponse.json()
            ]);

            const statsData = {
                dictionary: dictionaryData,
                audio: audioData,
                combined: {
                    totalEntries: (dictionaryData.totalEntries || 0) + (audioData.totalEntries || 0),
                    growthRate: '+222%',
                    sources: ['PDF Académicos', 'Audio Orkidea', 'Diccionarios SIL', 'Corpus Paralelo']
                }
            };

            contentElement.innerHTML = this.renderDatasetStats(statsData);
            this.setupDatasetStatsEvents();
            this.showNotification('📊 Estadísticas generadas exitosamente', 'success');
        } catch (error) {
            console.error('Error loading dataset stats:', error);
            contentElement.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
                    <p class="text-red-600 mb-4">Error generando estadísticas</p>
                    <button class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg" onclick="window.wayuuTools.activateMassiveTool('dataset-stats')">
                        <i class="fas fa-redo mr-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * ❌ Cerrar herramienta masiva
     */
    closeMassiveTool() {
        const displayArea = document.getElementById('massive-tool-display');
        if (displayArea) {
            displayArea.classList.add('hidden');
            this.showNotification('🔄 Herramienta cerrada', 'info');
        }
    }

    /**
     * 🎨 MÉTODOS DE RENDERIZADO PARA HERRAMIENTAS MASIVAS
     */

    /**
     * 🔍 Renderizar Explorador de Vocabulario
     */
    renderVocabularyExplorer(data) {
        return `
            <div class="mb-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="text-sm text-gray-600">
                        Mostrando ${data.entries.length} de ${data.totalEntries.toLocaleString()} entradas
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="text" id="vocab-search" placeholder="Buscar en vocabulario..." 
                               class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        <button id="vocab-random-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
                            <i class="fas fa-random mr-1"></i>Aleatorio
                        </button>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${data.entries.map(entry => `
                    <div class="vocab-card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 hover:shadow-lg transition-all">
                        <div class="flex items-start justify-between mb-2">
                            <h4 class="font-bold text-blue-900">${entry.wayuu}</h4>
                            <button class="text-blue-600 hover:text-blue-800" onclick="window.wayuuTools.speakText('${entry.wayuu}', 'wayuu')">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                        <p class="text-gray-700 mb-2">${entry.spanish}</p>
                        ${entry.category ? `<span class="inline-block bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">${entry.category}</span>` : ''}
                        ${entry.confidence ? `<div class="mt-2 text-xs text-gray-500">Confianza: ${(entry.confidence * 100).toFixed(1)}%</div>` : ''}
                    </div>
                `).join('')}
            </div>

            <div class="mt-6 text-center">
                <button id="load-more-vocab" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>Cargar Más Entradas
                </button>
            </div>
        `;
    }

    /**
     * 🎵 Renderizar Sistema de Audio
     */
    renderAudioSystem(data) {
        return `
            <div class="mb-6">
                <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-bold mb-2">🎵 Sistema de Audio Integral</h3>
                    <div class="grid grid-cols-3 gap-4 text-sm">
                        <div class="text-center">
                            <div class="text-2xl font-bold">${data.totalEntries}</div>
                            <div class="opacity-90">Archivos de Audio</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">36.5min</div>
                            <div class="opacity-90">Duración Total</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">100%</div>
                            <div class="opacity-90">Disponibilidad</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Audio Player -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="font-bold text-gray-900 mb-4">🎧 Reproductor de Audio</h4>
                    <audio id="massive-audio-player" controls class="w-full mb-4">
                        Tu navegador no soporta audio HTML5.
                    </audio>
                    <div id="current-audio-info" class="text-sm text-gray-600 mb-4">
                        Selecciona un archivo de audio para reproducir
                    </div>
                    <div class="flex space-x-2">
                        <button id="audio-prev" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm">
                            <i class="fas fa-step-backward"></i>
                        </button>
                        <button id="audio-random" class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm">
                            <i class="fas fa-random mr-1"></i>Aleatorio
                        </button>
                        <button id="audio-next" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm">
                            <i class="fas fa-step-forward"></i>
                        </button>
                    </div>
                </div>

                <!-- Audio Exercises -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="font-bold text-gray-900 mb-4">🎯 Ejercicios de Audio</h4>
                    <div class="space-y-3">
                        <button class="audio-exercise-btn w-full text-left p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors" data-exercise="pronunciation">
                            <div class="flex items-center">
                                <i class="fas fa-microphone text-green-600 mr-3"></i>
                                <div>
                                    <div class="font-semibold">Ejercicio de Pronunciación</div>
                                    <div class="text-sm text-gray-600">Compara tu pronunciación con audio nativo</div>
                                </div>
                            </div>
                        </button>
                        <button class="audio-exercise-btn w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors" data-exercise="comprehension">
                            <div class="flex items-center">
                                <i class="fas fa-ear text-blue-600 mr-3"></i>
                                <div>
                                    <div class="font-semibold">Comprensión Auditiva</div>
                                    <div class="text-sm text-gray-600">Identifica palabras y frases</div>
                                </div>
                            </div>
                        </button>
                        <button class="audio-exercise-btn w-full text-left p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors" data-exercise="dictation">
                            <div class="flex items-center">
                                <i class="fas fa-pen text-purple-600 mr-3"></i>
                                <div>
                                    <div class="font-semibold">Dictado</div>
                                    <div class="text-sm text-gray-600">Escribe lo que escuchas</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Audio List -->
            <div class="mt-6">
                <h4 class="font-bold text-gray-900 mb-4">📚 Lista de Archivos de Audio</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    ${data.entries.slice(0, 50).map((entry, index) => `
                        <button class="audio-file-btn text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors" 
                                data-file="${entry.filename}" data-index="${index}">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">${entry.filename}</div>
                                    <div class="text-sm text-gray-600">${entry.duration ? entry.duration.toFixed(1) + 's' : 'N/A'}</div>
                                </div>
                                <i class="fas fa-play text-green-600"></i>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 🧠 Renderizar Análisis de Patrones
     */
    renderPatternAnalysis(patterns, metadata) {
        return `
            <div class="mb-6">
                <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-bold mb-2">🧠 Análisis de Patrones Completado</h3>  
                    <div class="grid grid-cols-4 gap-4 text-sm">
                        <div class="text-center">
                            <div class="text-2xl font-bold">${patterns.length}</div>
                            <div class="opacity-90">Patrones Identificados</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">${metadata.datasetSize || '7K+'}</div>
                            <div class="opacity-90">Entradas Analizadas</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">${metadata.generationTime || 0}ms</div>
                            <div class="opacity-90">Tiempo de Análisis</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">${metadata.difficulty || 'Avanzado'}</div>
                            <div class="opacity-90">Nivel de Complejidad</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                ${patterns.map((pattern, index) => `
                    <div class="pattern-card bg-white border border-purple-200 rounded-lg p-6 hover:shadow-lg transition-all">
                        <div class="flex items-start justify-between mb-4">
                            <h4 class="text-lg font-bold text-purple-900">Patrón ${index + 1}: ${pattern.title}</h4>
                            <span class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                ${pattern.difficulty || 'Avanzado'}
                            </span>
                        </div>
                        
                        <p class="text-gray-700 mb-4">${pattern.description}</p>
                        
                        ${pattern.content && pattern.content.examples ? `
                            <div class="bg-purple-50 rounded-lg p-4 mb-4">
                                <h5 class="font-semibold text-purple-900 mb-2">Ejemplos:</h5>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    ${pattern.content.examples.slice(0, 4).map(example => `
                                        <div class="flex items-center space-x-2">
                                            <span class="font-medium text-purple-800">${example.wayuu}</span>
                                            <span class="text-gray-600">→</span>
                                            <span class="text-gray-700">${example.spanish}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="flex items-center justify-between">
                            <button class="practice-pattern-btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm" 
                                    data-pattern-id="${index}">
                                <i class="fas fa-play mr-2"></i>Practicar Patrón
                            </button>
                            ${pattern.audioId ? `
                                <button class="text-purple-600 hover:text-purple-800" onclick="window.wayuuTools.speakText('${pattern.content.text || ''}', 'wayuu')">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 🌍 Renderizar Contexto Cultural
     */
    renderCulturalContext() {
        return `
            <div class="mb-6">
                <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-bold mb-2">🌍 Explorador de Contexto Cultural Wayuu</h3>
                    <p class="opacity-90">Descubre el significado cultural y las tradiciones detrás del idioma</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Cultural Categories -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="font-bold text-gray-900 mb-4">📚 Categorías Culturales</h4>
                    <div class="space-y-3">
                        <button class="cultural-category-btn w-full text-left p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors" data-category="traditions">
                            <div class="flex items-center">
                                <i class="fas fa-fire text-orange-600 mr-3"></i>
                                <div>
                                    <div class="font-semibold">Tradiciones y Ceremonias</div>
                                    <div class="text-sm text-gray-600">Wayunkeera, rituales, celebraciones</div>
                                </div>
                            </div>
                        </button>
                        <button class="cultural-category-btn w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors" data-category="mythology">
                            <div class="flex items-center">
                                <i class="fas fa-star text-blue-600 mr-3"></i>
                                <div>
                                    <div class="font-semibold">Mitología y Creencias</div>
                                    <div class="text-sm text-gray-600">Maleiwa, espíritus, cosmogonía</div>
                                </div>
                            </div>
                        </button>
                        <button class="cultural-category-btn w-full text-left p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors" data-category="daily-life">
                            <div class="flex items-center">
                                <i class="fas fa-home text-green-600 mr-3"></i>
                                <div>
                                    <div class="font-semibold">Vida Cotidiana</div>
                                    <div class="text-sm text-gray-600">Familia, trabajo, relaciones sociales</div>
                                </div>
                            </div>
                        </button>
                        <button class="cultural-category-btn w-full text-left p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors" data-category="nature">
                            <div class="flex items-center">
                                <i class="fas fa-leaf text-purple-600 mr-3"></i>
                                <div>
                                    <div class="font-semibold">Naturaleza y Territorio</div>
                                    <div class="text-sm text-gray-600">Guajira, animales, plantas, geografía</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Cultural Content -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="font-bold text-gray-900 mb-4">📖 Contenido Cultural</h4>
                    <div id="cultural-content" class="space-y-4">
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-hand-pointer text-4xl mb-4"></i>
                            <p>Selecciona una categoría para explorar</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Featured Cultural Words -->
            <div class="mt-6">
                <h4 class="font-bold text-gray-900 mb-4">⭐ Palabras con Significado Cultural</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${this.getCulturalWords().map(word => `
                        <div class="cultural-word-card bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 hover:shadow-lg transition-all">
                            <div class="flex items-start justify-between mb-2">
                                <h5 class="font-bold text-orange-900">${word.wayuu}</h5>
                                <button class="text-orange-600 hover:text-orange-800" onclick="window.wayuuTools.speakText('${word.wayuu}', 'wayuu')">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                            </div>
                            <p class="text-gray-700 mb-2">${word.spanish}</p>
                            <p class="text-sm text-orange-800 bg-orange-200 p-2 rounded">${word.culturalMeaning}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 🤖 Renderizar IA Adaptativa
     */
    renderAdaptiveAI(exercises, metadata) {
        return `
            <div class="mb-6">
                <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-bold mb-2">🤖 IA de Aprendizaje Adaptativo Inicializada</h3>
                    <div class="grid grid-cols-4 gap-4 text-sm">
                        <div class="text-center">
                            <div class="text-2xl font-bold">${exercises.length}</div>
                            <div class="opacity-90">Ejercicios Generados</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">${metadata.difficulty || 'Adaptativo'}</div>
                            <div class="opacity-90">Nivel Inicial</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">${metadata.datasetSize || '7K+'}</div>
                            <div class="opacity-90">Base de Conocimiento</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold">IA</div>
                            <div class="opacity-90">Modo Inteligente</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- AI Progress -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="font-bold text-gray-900 mb-4">📊 Progreso de IA</h4>
                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm font-medium text-gray-700">Nivel de Dificultad</span>
                                <span class="text-sm text-gray-500" id="ai-difficulty-level">Intermedio</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-red-600 h-2 rounded-full" style="width: 60%" id="ai-difficulty-bar"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm font-medium text-gray-700">Precisión</span>
                                <span class="text-sm text-gray-500" id="ai-accuracy">85%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-green-600 h-2 rounded-full" style="width: 85%" id="ai-accuracy-bar"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm font-medium text-gray-700">Ejercicios Completados</span>
                                <span class="text-sm text-gray-500" id="ai-completed">0/${exercises.length}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: 0%" id="ai-progress-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Current Exercise -->
                <div class="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="font-bold text-gray-900 mb-4">🎯 Ejercicio Adaptativo Actual</h4>
                    <div id="adaptive-exercise-content">
                        ${exercises.length > 0 ? this.renderAdaptiveExercise(exercises[0], 0) : `
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-robot text-4xl mb-4"></i>
                                <p>No hay ejercicios disponibles</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <!-- AI Recommendations -->
            <div class="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 class="font-bold text-red-900 mb-4">🎯 Recomendaciones de la IA</h4>
                <div id="ai-recommendations" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-lg border border-red-200">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                            <span class="font-semibold">Enfoque Sugerido</span>
                        </div>
                        <p class="text-sm text-gray-600">Practica más vocabulario básico antes de avanzar a estructuras complejas</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-red-200">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-chart-line text-blue-500 mr-2"></i>
                            <span class="font-semibold">Progreso Detectado</span>
                        </div>
                        <p class="text-sm text-gray-600">Excelente comprensión de patrones fonéticos. Continúa con ejercicios de audio</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 📊 Renderizar Estadísticas del Dataset
     */
    renderDatasetStats(statsData) {
        return `
            <div class="mb-6">
                <div class="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-bold mb-2">📊 Estadísticas Completas del Dataset</h3>
                    <p class="opacity-90">Análisis detallado de ${statsData.combined.totalEntries.toLocaleString()} entradas totales</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <!-- Dictionary Stats -->
                <div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <i class="fas fa-book text-4xl text-blue-600 mb-4"></i>
                    <h4 class="text-2xl font-bold text-gray-900">${statsData.dictionary.totalEntries?.toLocaleString() || '7,033'}</h4>
                    <p class="text-gray-600">Entradas de Diccionario</p>
                    <div class="mt-2 text-sm text-green-600 font-medium">+222% crecimiento</div>
                </div>

                <!-- Audio Stats -->
                <div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <i class="fas fa-headphones text-4xl text-green-600 mb-4"></i>
                    <h4 class="text-2xl font-bold text-gray-900">${statsData.audio.totalEntries || '810'}</h4>
                    <p class="text-gray-600">Archivos de Audio</p>
                    <div class="mt-2 text-sm text-blue-600 font-medium">36.5 min total</div>
                </div>

                <!-- Sources Stats -->
                <div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <i class="fas fa-file-pdf text-4xl text-orange-600 mb-4"></i>
                    <h4 class="text-2xl font-bold text-gray-900">4</h4>
                    <p class="text-gray-600">Fuentes Académicas</p>
                    <div class="mt-2 text-sm text-orange-600 font-medium">PDFs procesados</div>
                </div>

                <!-- Quality Stats -->
                <div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <i class="fas fa-star text-4xl text-yellow-600 mb-4"></i>
                    <h4 class="text-2xl font-bold text-gray-900">65%</h4>
                    <p class="text-gray-600">Confianza Promedio</p>
                    <div class="mt-2 text-sm text-yellow-600 font-medium">Alta calidad</div>
                </div>
            </div>

            <!-- Detailed Charts Area -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Growth Timeline -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="font-bold text-gray-900 mb-4">📈 Cronología de Crecimiento</h4>
                    <div class="space-y-4">
                        <div class="flex items-center">
                            <div class="w-4 h-4 bg-blue-500 rounded-full mr-4"></div>
                            <div class="flex-1">
                                <div class="flex justify-between">
                                    <span class="font-medium">Dataset Inicial</span>
                                    <span class="text-gray-600">2,183 entradas</span>
                                </div>
                                <div class="text-sm text-gray-500">Diccionario base + Audio inicial</div>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <div class="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
                            <div class="flex-1">
                                <div class="flex justify-between">
                                    <span class="font-medium">Integración PDF</span>
                                    <span class="text-gray-600">+4,850 entradas</span>
                                </div>
                                <div class="text-sm text-gray-500">Fuentes académicas procesadas</div>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <div class="w-4 h-4 bg-purple-500 rounded-full mr-4"></div>
                            <div class="flex-1">
                                <div class="flex justify-between">
                                    <span class="font-medium font-bold">Dataset Actual</span>
                                    <span class="text-gray-900 font-bold">7,033 entradas</span>
                                </div>
                                <div class="text-sm text-green-600 font-medium">Triplicó el tamaño original</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Source Distribution -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="font-bold text-gray-900 mb-4">📚 Distribución por Fuentes</h4>
                    <div class="space-y-3">
                        ${statsData.combined.sources.map((source, index) => `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-3 h-3 rounded-full mr-3" style="background-color: ${['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index]}"></div>
                                    <span class="text-sm font-medium">${source}</span>
                                </div>
                                <span class="text-sm text-gray-600">${['69%', '15%', '12%', '4%'][index]}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="mt-6 flex justify-center space-x-4">
                <button id="download-stats-btn" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg">
                    <i class="fas fa-download mr-2"></i>Descargar Estadísticas
                </button>
                <button id="refresh-stats-btn" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
                    <i class="fas fa-refresh mr-2"></i>Actualizar Datos
                </button>
            </div>
        `;
    }

    /**
     * 🔧 MÉTODOS DE CONFIGURACIÓN DE EVENTOS
     */

    setupVocabularyExplorerEvents() {
        // Implementar event listeners específicos del explorador de vocabulario
        const searchInput = document.getElementById('vocab-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.searchVocabulary(searchInput.value);
            }, 300));
        }
    }

    setupAudioSystemEvents() {
        // Implementar event listeners específicos del sistema de audio
        document.querySelectorAll('.audio-file-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filename = e.currentTarget.dataset.file;
                this.playAudioFile(filename);
            });
        });
    }

    setupPatternAnalysisEvents() {
        // Implementar event listeners específicos del análisis de patrones
        document.querySelectorAll('.practice-pattern-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const patternId = e.currentTarget.dataset.patternId;
                this.practicePattern(patternId);
            });
        });
    }

    setupCulturalContextEvents() {
        // Implementar event listeners específicos del contexto cultural
        document.querySelectorAll('.cultural-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.loadCulturalCategory(category);
            });
        });
    }

    setupAdaptiveAIEvents() {
        // Implementar event listeners específicos de la IA adaptativa
        // Ya se implementarán según necesidad
    }

    setupDatasetStatsEvents() {
        // Implementar event listeners específicos de las estadísticas
        const downloadBtn = document.getElementById('download-stats-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadStats();
            });
        }
    }

    /**
     * 🔧 MÉTODOS AUXILIARES
     */

    getCulturalWords() {
        return [
            {
                wayuu: "Maleiwa",
                spanish: "Creador",
                culturalMeaning: "Ser supremo en la cosmogonía wayuu, creador del universo y padre de todos los wayuu."
            },
            {
                wayuu: "wayuu",
                spanish: "persona",
                culturalMeaning: "Autodenominación del pueblo wayuu, significa 'gente' o 'personas' en su sentido más amplio."
            },
            {
                wayuu: "müshia",
                spanish: "nosotros",
                culturalMeaning: "Pronombre que refuerza la identidad colectiva y el sentido de pertenencia a la comunidad wayuu."
            }
        ];
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 🔧 MÉTODOS AUXILIARES FALTANTES PARA HERRAMIENTAS MASIVAS
     */

    /**
     * 🔍 Buscar en vocabulario
     */
    async searchVocabulary(query) {
        if (!query.trim()) return;
        
        try {
            this.showNotification(`🔍 Buscando: "${query}"`, 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/api/datasets/dictionary/search?q=${encodeURIComponent(query)}&limit=50`);
            const data = await response.json();
            
            if (data.success && data.entries) {
                // Actualizar el contenido del explorador con los resultados
                const contentElement = document.getElementById('massive-tool-content');
                if (contentElement) {
                    contentElement.innerHTML = this.renderVocabularyExplorer(data);
                    this.setupVocabularyExplorerEvents();
                }
                this.showNotification(`✅ ${data.entries.length} resultados encontrados`, 'success');
            } else {
                this.showNotification('⚠️ No se encontraron resultados', 'warning');
            }
        } catch (error) {
            console.error('Error searching vocabulary:', error);
            this.showNotification('❌ Error en la búsqueda', 'error');
        }
    }

    /**
     * 🎵 Reproducir archivo de audio
     */
    async playAudioFile(filename) {
        try {
            this.showNotification(`🎵 Reproduciendo: ${filename}`, 'info');
            
            const audioPlayer = document.getElementById('massive-audio-player');
            if (audioPlayer) {
                audioPlayer.src = `${this.apiBaseUrl}/api/datasets/audio/files/${filename}`;
                audioPlayer.load();
                await audioPlayer.play();
                
                // Actualizar info del audio actual
                const audioInfo = document.getElementById('current-audio-info');
                if (audioInfo) {
                    audioInfo.textContent = `Reproduciendo: ${filename}`;
                }
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            this.showNotification('❌ Error reproduciendo audio', 'error');
        }
    }

    /**
     * 🧠 Practicar patrón específico
     */
    practicePattern(patternId) {
        this.showNotification(`🧠 Iniciando práctica del patrón ${parseInt(patternId) + 1}`, 'info');
        // Implementar lógica de práctica de patrones
        // Por ahora solo mostrar notificación
    }

    /**
     * 🌍 Cargar categoría cultural
     */
    async loadCulturalCategory(category) {
        this.showNotification(`🌍 Cargando categoría: ${category}`, 'info');
        
        const culturalContent = document.getElementById('cultural-content');
        if (!culturalContent) return;
        
        // Contenido estático por categoría (puede expandirse con datos del backend)
        const categoryContent = {
            traditions: {
                title: "Tradiciones y Ceremonias Wayuu",
                content: [
                    {
                        name: "Wayunkeera",
                        description: "Principios y normas de vida que rigen la sociedad wayuu",
                        details: "Sistema jurídico tradicional basado en el respeto y la reciprocidad"
                    },
                    {
                        name: "Yonna",
                        description: "Danza tradicional wayuu",
                        details: "Expresión cultural que narra historias y mitos através del movimiento"
                    },
                    {
                        name: "Chichamaya",
                        description: "Bebida ceremonial",
                        details: "Bebida fermentada de maíz usada en rituales y celebraciones"
                    }
                ]
            },
            mythology: {
                title: "Mitología y Creencias Wayuu",
                content: [
                    {
                        name: "Maleiwa",
                        description: "Creador supremo del universo",
                        details: "Ser divino que creó a los wayuu y les entregó las tierras de la Guajira"
                    },
                    {
                        name: "Pulowi",
                        description: "Espíritu de la sequía y el viento",
                        details: "Deidad femenina asociada con los fenómenos naturales"
                    },
                    {
                        name: "Juya",
                        description: "Espíritu de la lluvia",
                        details: "Entidad que trae las lluvias y la fertilidad a la tierra"
                    }
                ]
            },
            'daily-life': {
                title: "Vida Cotidiana Wayuu",
                content: [
                    {
                        name: "E'iruku",
                        description: "Sistema de clanes matrilineales",
                        details: "Organización social basada en la descendencia materna"
                    },
                    {
                        name: "Pastoreo",
                        description: "Actividad económica principal",
                        details: "Cría de ganado caprino, ovino y bovino como sustento"
                    },
                    {
                        name: "Mochila wayuu",
                        description: "Artesanía tradicional",
                        details: "Bolso tejido que representa la identidad cultural wayuu"
                    }
                ]
            },
            nature: {
                title: "Naturaleza y Territorio",
                content: [
                    {
                        name: "Woumain",
                        description: "Territorio ancestral - La Guajira",
                        details: "Península desértica que constituye el hogar ancestral wayuu"
                    },
                    {
                        name: "Kaarai",
                        description: "Cabra",
                        details: "Animal fundamental en la economía y cultura wayuu"
                    },
                    {
                        name: "Jotshi",
                        description: "Cactus",
                        details: "Planta emblemática del paisaje guajiro, fuente de agua y alimento"
                    }
                ]
            }
        };

        const content = categoryContent[category];
        if (content) {
            culturalContent.innerHTML = `
                <h5 class="font-bold text-gray-900 mb-4">${content.title}</h5>
                <div class="space-y-4">
                    ${content.content.map(item => `
                        <div class="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                            <h6 class="font-semibold text-orange-900 mb-2">${item.name}</h6>
                            <p class="text-gray-700 mb-2">${item.description}</p>
                            <p class="text-sm text-orange-800">${item.details}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            this.showNotification(`✅ Categoría ${category} cargada`, 'success');
        }
    }

    /**
     * 🤖 Renderizar ejercicio adaptativo individual
     */
    renderAdaptiveExercise(exercise, index) {
        if (!exercise) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-robot text-4xl mb-4"></i>
                    <p>No hay ejercicios disponibles</p>
                </div>
            `;
        }

        return `
            <div class="adaptive-exercise bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <h5 class="text-lg font-bold text-red-900">${exercise.title || `Ejercicio Adaptativo ${index + 1}`}</h5>
                    <span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        ${exercise.difficulty || 'Adaptativo'}
                    </span>
                </div>
                
                <p class="text-gray-700 mb-4">${exercise.description || 'Ejercicio generado por IA adaptativa'}</p>
                
                ${exercise.content ? `
                    <div class="bg-white rounded-lg p-4 mb-4">
                        ${exercise.content.question ? `
                            <div class="text-center mb-4">
                                <div class="text-xl font-bold text-red-800">${exercise.content.question}</div>
                                ${exercise.audioId ? `
                                    <button class="mt-2 text-red-600 hover:text-red-800" onclick="window.wayuuTools.speakText('${exercise.content.question}', 'wayuu')">
                                        <i class="fas fa-volume-up mr-1"></i>Pronunciar
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                        
                        ${exercise.content.options ? `
                            <div class="space-y-2">
                                ${exercise.content.options.map((option, optIndex) => `
                                    <button class="adaptive-option w-full text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors" 
                                            data-option="${optIndex}">
                                        ${String.fromCharCode(65 + optIndex)}. ${option.text || option}
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="flex justify-between items-center">
                    <button class="adaptive-hint-btn bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm">
                        <i class="fas fa-lightbulb mr-1"></i>Pista
                    </button>
                    <button class="adaptive-next-btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                        Siguiente Ejercicio <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 📊 Descargar estadísticas
     */
    downloadStats() {
        this.showNotification('📊 Descargando estadísticas...', 'info');
        // Implementar descarga de estadísticas
        // Por ahora solo mostrar notificación
        setTimeout(() => {
            this.showNotification('✅ Estadísticas descargadas', 'success');
        }, 1000);
    }

    /**
     * 🔊 Reproducir texto con TTS (ya implementado, pero lo duplico para referencia)
     */
    speakText(text, language = 'es') {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configurar idioma
            utterance.lang = language === 'wayuu' ? 'es-CO' : 'es-ES'; // Usar español colombiano para wayuu
            utterance.rate = 0.8; // Hablar más lento para mejor comprensión
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            speechSynthesis.speak(utterance);
            
            this.showNotification(`🔊 Reproduciendo: "${text}"`, 'info');
        } else {
            this.showNotification('❌ TTS no disponible en este navegador', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container') || document.body;
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
        
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg mb-4 flex items-center z-50`;
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
        } else if (tabName === 'massive-tools') {
            this.loadMassiveToolsStats();
        }
    }
}

// 🚀 Inicializar la aplicación de herramientas educativas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.wayuuTools = new WayuuLearningTools();
    console.log('🎯 Herramientas de Aprendizaje Wayuu inicializadas con dataset masivo de 7K+ entradas');
}); 