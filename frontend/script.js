class WayuuTranslator {
    constructor() {
        this.apiUrl = 'http://localhost:3002/api';
        this.currentDirection = 'wayuu-to-spanish';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDatasetInfo();
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
            
            // Load stats
            const statsResponse = await fetch(`${this.apiUrl}/datasets/stats`);
            if (statsResponse.ok) {
                const statsResult = await statsResponse.json();
                const stats = statsResult.data;
                
                document.getElementById('wayuu-words').textContent = stats.uniqueWayuuWords || '-';
                document.getElementById('spanish-words').textContent = stats.uniqueSpanishWords || '-';
            }
            
        } catch (error) {
            console.error('Error loading dataset info:', error);
            document.getElementById('total-entries').textContent = 'Error';
        }
    }
}

// Initialize the translator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WayuuTranslator();
});
