class WayuuTranslator {
    constructor() {
        this.apiUrl = 'http://localhost:3002/api';
        this.currentDirection = 'wayuu-to-spanish';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDatasetInfo();
        this.loadCompleteStats();
    }

    bindEvents() {
        // Direction toggle buttons
        document.getElementById('wayuu-to-spanish').addEventListener('click', () => {
            this.setDirection('wayuu-to-spanish');
        });

        document.getElementById('spanish-to-wayuu').addEventListener('click', () => {
            this.setDirection('spanish-to-wayuu');
        });

        // Translate button
        document.getElementById('translate-btn').addEventListener('click', () => {
            this.translate();
        });

        // Refresh stats button
        document.getElementById('refresh-stats').addEventListener('click', () => {
            this.loadCompleteStats();
        });

        // Enter key in textarea
        document.getElementById('input-text').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.translate();
            }
        });

        // Clear output when input changes
        document.getElementById('input-text').addEventListener('input', () => {
            this.clearOutput();
        });
    }

    setDirection(direction) {
        this.currentDirection = direction;
        
        // Update button styles
        const wayuuBtn = document.getElementById('wayuu-to-spanish');
        const spanishBtn = document.getElementById('spanish-to-wayuu');
        
        if (direction === 'wayuu-to-spanish') {
            wayuuBtn.classList.add('bg-blue-600', 'text-white');
            wayuuBtn.classList.remove('text-gray-700', 'hover:text-gray-900');
            spanishBtn.classList.remove('bg-blue-600', 'text-white');
            spanishBtn.classList.add('text-gray-700', 'hover:text-gray-900');
            
            document.getElementById('input-label').textContent = 'Texto en Wayuu';
            document.getElementById('output-label').textContent = 'Traducción al Español';
            document.getElementById('input-text').placeholder = 'Escribe en Wayuunaiki...';
        } else {
            spanishBtn.classList.add('bg-blue-600', 'text-white');
            spanishBtn.classList.remove('text-gray-700', 'hover:text-gray-900');
            wayuuBtn.classList.remove('bg-blue-600', 'text-white');
            wayuuBtn.classList.add('text-gray-700', 'hover:text-gray-900');
            
            document.getElementById('input-label').textContent = 'Texto en Español';
            document.getElementById('output-label').textContent = 'Traducción al Wayuu';
            document.getElementById('input-text').placeholder = 'Escribe en español...';
        }
        
        this.clearOutput();
    }

    async translate() {
        const inputText = document.getElementById('input-text').value.trim();
        
        if (!inputText) {
            this.showError('Por favor ingresa texto para traducir');
            return;
        }

        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.apiUrl}/translation/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: inputText,
                    direction: this.currentDirection,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayTranslation(result);
            
        } catch (error) {
            console.error('Translation error:', error);
            this.showError('Error al traducir. Por favor intenta de nuevo.');
        } finally {
            this.showLoading(false);
        }
    }

    displayTranslation(result) {
        const outputDiv = document.getElementById('output-text');
        outputDiv.innerHTML = `<span class="text-gray-900">${result.translatedText}</span>`;
        
        // Show confidence
        this.showConfidence(result.confidence);
        
        // Show alternatives
        if (result.alternatives && result.alternatives.length > 0) {
            this.showAlternatives(result.alternatives);
        } else {
            this.hideAlternatives();
        }
        
        // Show context
        if (result.contextInfo) {
            this.showContext(result.contextInfo);
        } else {
            this.hideContext();
        }
    }

    showConfidence(confidence) {
        const confidenceBar = document.getElementById('confidence-bar');
        const confidenceValue = document.getElementById('confidence-value');
        const confidenceFill = document.getElementById('confidence-fill');
        
        const percentage = Math.round(confidence * 100);
        
        confidenceValue.textContent = `${percentage}%`;
        confidenceFill.style.width = `${percentage}%`;
        
        // Change color based on confidence
        confidenceFill.className = 'h-2 rounded-full transition-all duration-500';
        if (percentage >= 80) {
            confidenceFill.classList.add('bg-green-600');
        } else if (percentage >= 60) {
            confidenceFill.classList.add('bg-yellow-500');
        } else {
            confidenceFill.classList.add('bg-red-500');
        }
        
        confidenceBar.classList.remove('hidden');
    }

    showAlternatives(alternatives) {
        const alternativesSection = document.getElementById('alternatives-section');
        const alternativesList = document.getElementById('alternatives-list');
        
        alternativesList.innerHTML = '';
        
        alternatives.forEach(alt => {
            const span = document.createElement('span');
            span.className = 'px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-pointer hover:bg-gray-200 transition-colors';
            span.textContent = alt;
            span.addEventListener('click', () => {
                document.getElementById('output-text').innerHTML = `<span class="text-gray-900">${alt}</span>`;
            });
            alternativesList.appendChild(span);
        });
        
        alternativesSection.classList.remove('hidden');
    }

    hideAlternatives() {
        document.getElementById('alternatives-section').classList.add('hidden');
    }

    showContext(contextInfo) {
        const contextSection = document.getElementById('context-section');
        const contextInfoElement = document.getElementById('context-info');
        
        contextInfoElement.textContent = contextInfo;
        contextSection.classList.remove('hidden');
    }

    hideContext() {
        document.getElementById('context-section').classList.add('hidden');
    }

    clearOutput() {
        document.getElementById('output-text').innerHTML = '<span class="text-gray-500 italic">La traducción aparecerá aquí...</span>';
        document.getElementById('confidence-bar').classList.add('hidden');
        this.hideAlternatives();
        this.hideContext();
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showError(message) {
        const outputDiv = document.getElementById('output-text');
        outputDiv.innerHTML = `<span class="text-red-600"><i class="fas fa-exclamation-triangle mr-2"></i>${message}</span>`;
        this.hideAlternatives();
        this.hideContext();
        document.getElementById('confidence-bar').classList.add('hidden');
    }

    async loadDatasetInfo() {
        try {
            const response = await fetch(`${this.apiUrl}/datasets`);
            if (!response.ok) throw new Error('Failed to load dataset info');
            
            const result = await response.json();
            const data = result.data;
            
            document.getElementById('total-entries').textContent = data.totalEntries || 0;
            
        } catch (error) {
            console.error('Error loading dataset info:', error);
            document.getElementById('total-entries').textContent = 'Error';
        }
    }

    async loadCompleteStats() {
        // Show loading progress
        this.showLoadingProgress(true);
        
        try {
            // Step 1: Load main stats (25%)
            this.updateProgress(25, 'Cargando estadísticas principales...');
            const statsResponse = await fetch(`${this.apiUrl}/datasets/stats`);
            
            if (statsResponse.ok) {
                const statsResult = await statsResponse.json();
                const stats = statsResult.data;
                
                // Update main stats
                this.animateNumber('total-entries', stats.totalEntries || 0);
                this.animateNumber('wayuu-words', stats.uniqueWayuuWords || 0);
                this.animateNumber('spanish-words', stats.uniqueSpanishWords || 0);
                
                // Format average with 2 decimals
                const avgWords = stats.averageSpanishWordsPerEntry || 0;
                document.getElementById('avg-words').textContent = avgWords.toFixed(2);
                
                // Update dataset source info
                if (stats.datasetInfo) {
                    document.getElementById('dataset-source').textContent = stats.datasetInfo.source || 'Gaxys/wayuu_spa_dict';
                    
                    // Format last updated date
                    if (stats.lastLoaded) {
                        const date = new Date(stats.lastLoaded);
                        document.getElementById('last-updated').textContent = date.toLocaleString('es-ES');
                    }
                    
                    // Update status with color
                    const statusElement = document.getElementById('dataset-status');
                    if (stats.totalEntries > 0) {
                        statusElement.innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>Activo</span>';
                    } else {
                        statusElement.innerHTML = '<span class="text-yellow-600"><i class="fas fa-exclamation-triangle mr-1"></i>Cargando</span>';
                    }
                }
            }
            
            // Step 2: Load cache info (50%)
            this.updateProgress(50, 'Cargando información de cache...');
            const cacheResponse = await fetch(`${this.apiUrl}/datasets/cache`);
            
            if (cacheResponse.ok) {
                const cacheResult = await cacheResponse.json();
                const cache = cacheResult.data;
                
                // Update cache info
                const cacheStatusElement = document.getElementById('cache-status');
                if (cache.exists) {
                    cacheStatusElement.innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>Disponible</span>';
                    document.getElementById('cache-size').textContent = cache.size || 'N/A';
                    document.getElementById('cache-entries').textContent = cache.metadata?.totalEntries || 'N/A';
                } else {
                    cacheStatusElement.innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle mr-1"></i>No disponible</span>';
                    document.getElementById('cache-size').textContent = 'N/A';
                    document.getElementById('cache-entries').textContent = 'N/A';
                }
            }
            
            // Step 3: Complete (100%)
            this.updateProgress(100, 'Estadísticas cargadas completamente');
            
            // Hide progress after a short delay
            setTimeout(() => {
                this.showLoadingProgress(false);
            }, 1000);
            
        } catch (error) {
            console.error('Error loading complete stats:', error);
            this.showStatsError();
            this.showLoadingProgress(false);
        }
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const startValue = 0;
        const duration = 1000; // 1 second
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
            
            element.textContent = currentValue.toLocaleString('es-ES');
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = targetValue.toLocaleString('es-ES');
            }
        };
        
        requestAnimationFrame(animate);
    }

    showLoadingProgress(show) {
        const progressDiv = document.getElementById('loading-progress');
        if (show) {
            progressDiv.classList.remove('hidden');
        } else {
            progressDiv.classList.add('hidden');
        }
    }

    updateProgress(percentage, message) {
        document.getElementById('progress-percentage').textContent = `${percentage}%`;
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        
        // Update message if provided
        if (message) {
            const messageElement = document.querySelector('#loading-progress span');
            messageElement.textContent = message;
        }
    }

    showStatsError() {
        // Show error state in stats
        document.getElementById('total-entries').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('wayuu-words').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('spanish-words').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('avg-words').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        
        // Update status
        document.getElementById('dataset-status').innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle mr-1"></i>Error</span>';
        document.getElementById('cache-status').innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle mr-1"></i>Error</span>';
    }
}

// Initialize the translator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WayuuTranslator();
});
