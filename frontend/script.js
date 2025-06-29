// Authentication Manager Class
class AuthManager {
    constructor() {
        this.apiUrl = 'http://localhost:3002/api';
        this.user = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.bindAuthEvents();
        this.checkAuthStatus();
    }

    bindAuthEvents() {
        // Login button
        document.getElementById('login-btn').addEventListener('click', () => {
            this.login();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Auth warning login
        document.getElementById('auth-warning-login').addEventListener('click', () => {
            this.login();
        });
    }

    async checkAuthStatus() {
        try {
            // First, check if we have OAuth callback parameters in the URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            const userParam = urlParams.get('user');
            
            if (token && userParam) {
                try {
                    // Parse user data from URL parameter
                    const userData = JSON.parse(decodeURIComponent(userParam));
                    
                    // Store token in localStorage for future requests
                    localStorage.setItem('authToken', token);
                    
                    // Set user data
                    this.setUser({
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        roles: userData.roles,
                        displayName: userData.name,
                        // Check if user has admin role
                        role: userData.roles.includes('admin') ? 'admin' : 'user'
                    });
                    
                    // Clean URL to remove sensitive parameters
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    this.showNotification(`¡Bienvenido, ${userData.name}!`, 'success');
                    this.updateSystemStatus('online');
                    return;
                } catch (error) {
                    console.error('Error parsing user data from URL:', error);
                    // Clean URL anyway
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
            
            // Check if we have a stored token
            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
                try {
                    const profileResponse = await fetch(`${this.apiUrl}/auth/profile`, {
                        credentials: 'include',
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    });
                    
                    if (profileResponse.ok) {
                        const userData = await profileResponse.json();
                        this.setUser(userData);
                        this.updateSystemStatus('online');
                        return;
                    } else {
                        // Token is invalid, remove it
                        localStorage.removeItem('authToken');
                    }
                } catch (error) {
                    console.log('Error with stored token:', error);
                    localStorage.removeItem('authToken');
                }
            }
            
            // No stored token or OAuth params, check general auth status
            const response = await fetch(`${this.apiUrl}/auth/status`);
            const statusData = await response.json();
            
            if (response.ok) {
                this.updateSystemStatus('online');
                
                // Try to get profile with cookies (fallback)
                try {
                    const profileResponse = await fetch(`${this.apiUrl}/auth/profile`, {
                        credentials: 'include'
                    });
                    
                    if (profileResponse.ok) {
                        const userData = await profileResponse.json();
                        this.setUser(userData);
                    } else {
                        this.setUser(null);
                    }
                } catch (error) {
                    console.log('User not authenticated');
                    this.setUser(null);
                }
            } else {
                this.updateSystemStatus('offline');
                this.setUser(null);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.updateSystemStatus('offline');
            this.setUser(null);
        }
    }

    login() {
        // Redirect to Google OAuth
        window.location.href = `${this.apiUrl}/auth/google`;
    }

    async logout() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            // Clear stored token regardless of response
            localStorage.removeItem('authToken');
            
            if (response.ok) {
                this.setUser(null);
                this.showNotification('Sesión cerrada exitosamente', 'success');
            } else {
                this.setUser(null); // Clear user anyway
                this.showNotification('Sesión cerrada localmente', 'info');
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Clear user and token locally even if server request fails
            localStorage.removeItem('authToken');
            this.setUser(null);
            this.showNotification('Sesión cerrada localmente', 'info');
        }
    }

    setUser(userData) {
        this.user = userData;
        this.isAuthenticated = !!userData;
        this.updateAuthUI();
    }

    updateAuthUI() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userInfo = document.getElementById('user-info');
        const authStatusBadge = document.getElementById('auth-status-badge');
        const authWarning = document.getElementById('auth-warning');

        if (this.isAuthenticated && this.user) {
            // Show user info
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            userInfo.classList.remove('hidden');
            authStatusBadge.classList.remove('hidden');
            authWarning.classList.add('hidden');

            // Populate user data
            document.getElementById('user-name').textContent = this.user.displayName || this.user.name || 'Usuario';
            document.getElementById('user-email').textContent = this.user.email || '';
            
            if (this.user.photos && this.user.photos[0]) {
                document.getElementById('user-avatar').src = this.user.photos[0].value;
            }

            // Role badge
            const roleBadge = document.getElementById('user-role-badge');
            if (this.user.role === 'admin') {
                roleBadge.textContent = 'Administrador';
                roleBadge.className = 'px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800';
            } else {
                roleBadge.textContent = 'Usuario';
                roleBadge.className = 'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800';
            }
        } else {
            // Show login button
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            userInfo.classList.add('hidden');
            authStatusBadge.classList.add('hidden');
            authWarning.classList.remove('hidden');
        }
    }

    updateSystemStatus(status) {
        const systemStatus = document.getElementById('system-status');
        const statusIcon = systemStatus.querySelector('i');
        const statusText = systemStatus.querySelector('span');

        if (status === 'online') {
            statusIcon.className = 'fas fa-circle text-green-500 mr-1';
            statusText.textContent = 'Sistema Online';
        } else {
            statusIcon.className = 'fas fa-circle text-red-500 mr-1';
            statusText.textContent = 'Sistema Offline';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.className += ' bg-green-500 text-white';
                break;
            case 'error':
                notification.className += ' bg-red-500 text-white';
                break;
            case 'warning':
                notification.className += ' bg-yellow-500 text-white';
                break;
            default:
                notification.className += ' bg-blue-500 text-white';
        }
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    isUserAdmin() {
        return this.isAuthenticated && this.user && this.user.role === 'admin';
    }

    requireAuth(action) {
        if (!this.isAuthenticated) {
            this.showNotification('Esta acción requiere autenticación. Por favor inicia sesión.', 'error');
            return false;
        }
        return true;
    }

    requireAdmin(action) {
        if (!this.isUserAdmin()) {
            this.showNotification('Esta acción requiere permisos de administrador.', 'error');
            return false;
        }
        return true;
    }
}

class WayuuTranslator {
    constructor() {
        this.apiUrl = 'http://localhost:3002/api';
        this.currentDirection = 'wayuu-to-spanish';
        this.authManager = new AuthManager();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDatasetInfo();
        this.loadCompleteStats();
        this.initAudioPlayer();
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
        if (document.getElementById('refresh-stats')) {
            document.getElementById('refresh-stats').addEventListener('click', () => {
                this.loadCompleteStats();
            });
        }

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

    initAudioPlayer() {
        // Audio search functionality
        document.getElementById('search-audio-btn').addEventListener('click', () => {
            this.searchAudio();
        });

        document.getElementById('audio-search').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchAudio();
            }
        });

        // Random audio button
        if (document.getElementById('random-audio-btn')) {
            document.getElementById('random-audio-btn').addEventListener('click', () => {
                this.playRandomAudio();
            });
        }
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const token = localStorage.getItem('authToken');
        
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        // Add Authorization header if we have a token
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            
            // If unauthorized, clear token and redirect to login
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                this.authManager.setUser(null);
                this.showNotification('Sesión expirada. Por favor inicia sesión nuevamente.', 'warning');
                return null;
            }
            
            return response;
        } catch (error) {
            console.error('Authenticated request error:', error);
            this.showNotification('Error en la conexión', 'error');
            return null;
        }
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
            // Step 0: Load sources (10%)
            this.updateProgress(10, 'Cargando fuentes de datos...');
            await this.loadSources();
            
            // Step 1: Load main stats (30%)
            this.updateProgress(30, 'Cargando estadísticas principales...');
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
            
            // Step 2: Load audio stats (55%)
            this.updateProgress(55, 'Cargando estadísticas de audio...');
            const audioStatsResponse = await fetch(`${this.apiUrl}/datasets/audio/stats`);
            
            if (audioStatsResponse.ok) {
                const audioStatsResult = await audioStatsResponse.json();
                const audioStats = audioStatsResult.data;
                
                // Update audio stats
                this.animateNumber('total-audio-entries', audioStats.totalAudioEntries || 0);
                this.animateNumber('audio-transcription-words', audioStats.uniqueWayuuWords || 0);
                
                // Format duration
                const totalMinutes = audioStats.totalDurationMinutes || 0;
                const avgSeconds = audioStats.averageDurationSeconds || 0;
                
                document.getElementById('total-audio-duration').textContent = `${totalMinutes.toFixed(1)} min`;
                document.getElementById('avg-audio-duration').textContent = `${avgSeconds.toFixed(1)}s`;
                
                // Update audio dataset info
                const avgTranscriptionLength = audioStats.averageTranscriptionLength || 0;
                document.getElementById('avg-transcription-length').textContent = `${avgTranscriptionLength.toFixed(0)} caracteres`;
                
                // Update audio status
                const audioStatusElement = document.getElementById('audio-dataset-status');
                if (audioStats.totalAudioEntries > 0) {
                    audioStatusElement.innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>Activo</span>';
                } else {
                    audioStatusElement.innerHTML = '<span class="text-yellow-600"><i class="fas fa-exclamation-triangle mr-1"></i>Cargando</span>';
                }
            }
            
            // Step 3: Load cache info (80%)
            this.updateProgress(80, 'Cargando información de cache...');
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
            
            // Step 4: Complete (100%)
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
        // Show error state in dictionary stats
        document.getElementById('total-entries').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('wayuu-words').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('spanish-words').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('avg-words').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        
        // Show error state in audio stats
        document.getElementById('total-audio-entries').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('total-audio-duration').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('audio-transcription-words').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        document.getElementById('avg-audio-duration').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        
        // Update status
        document.getElementById('dataset-status').innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle mr-1"></i>Error</span>';
        document.getElementById('audio-dataset-status').innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle mr-1"></i>Error</span>';
        document.getElementById('cache-status').innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle mr-1"></i>Error</span>';
    }

    async loadSources() {
        try {
            const response = await fetch(`${this.apiUrl}/datasets/sources`);
            if (!response.ok) throw new Error('Failed to load sources');
            
            const result = await response.json();
            const sources = result.data.sources;
            
            this.renderSources(sources);
            
        } catch (error) {
            console.error('Error loading sources:', error);
            this.showSourcesError();
        }
    }

    renderSources(sources) {
        const container = document.getElementById('sources-container');
        
        if (!sources || sources.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-database text-4xl mb-2"></i>
                    <div>No hay fuentes disponibles</div>
                </div>
            `;
            return;
        }

        container.innerHTML = sources.map(source => `
            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <div class="text-lg font-semibold text-gray-800 mr-3">
                                ${this.getSourceIcon(source.type)} ${source.name}
                            </div>
                            <div class="flex items-center space-x-2">
                                ${this.getStatusBadge(source.isActive)}
                                <div class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    Prioridad: ${source.priority}
                                </div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-600 mb-2">
                            ${source.description}
                            ${source.type === 'audio' && source.totalDurationFormatted ? `
                                <div class="mt-1 text-sm font-medium text-purple-600">
                                    <i class="fas fa-clock mr-1"></i>
                                    Tiempo total grabado: ${source.totalDurationFormatted} min
                                    ${source.totalEntries ? ` (${source.totalEntries} grabaciones)` : ''}
                                </div>
                            ` : ''}
                            ${source.type === 'dictionary' && source.totalEntries ? `
                                <div class="mt-1 text-sm font-medium text-blue-600">
                                    <i class="fas fa-book mr-1"></i>
                                    Entradas exactas: ${source.entriesFormatted || source.totalEntries.toLocaleString()}
                                </div>
                            ` : ''}
                        </div>
                        <div class="text-xs text-gray-500">
                            <i class="fas fa-link mr-1"></i>
                            <a href="${source.url}" target="_blank" class="hover:text-blue-600 transition-colors">
                                ${source.dataset}
                            </a>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                        <button 
                            onclick="translator.toggleSource('${source.id}')"
                            class="px-3 py-1 text-sm font-medium rounded transition-colors ${source.isActive 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'}"
                        >
                            ${source.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        ${source.isActive && source.type === 'dictionary' ? `
                            <button 
                                onclick="translator.loadSourcePreview('${source.id}')"
                                class="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                            >
                                Vista previa
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getSourceIcon(type) {
        switch (type) {
            case 'dictionary': return '<i class="fas fa-book text-blue-500"></i>';
            case 'audio': return '<i class="fas fa-volume-up text-purple-500"></i>';
            case 'mixed': return '<i class="fas fa-layer-group text-orange-500"></i>';
            default: return '<i class="fas fa-database text-gray-500"></i>';
        }
    }

    getStatusBadge(isActive) {
        return isActive 
            ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"><i class="fas fa-check-circle mr-1"></i>Activo</span>'
            : '<span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full"><i class="fas fa-pause-circle mr-1"></i>Inactivo</span>';
    }

    async toggleSource(sourceId) {
        try {
            const response = await fetch(`${this.apiUrl}/datasets/sources/${sourceId}/toggle`, {
                method: 'POST'
            });
            
            if (!response.ok) throw new Error('Failed to toggle source');
            
            const result = await response.json();
            
            if (result.success) {
                // Reload sources to update UI
                await this.loadSources();
                
                // Show notification
                this.showNotification(result.message, 'success');
            } else {
                this.showNotification(result.message || 'Error al cambiar el estado de la fuente', 'error');
            }
            
        } catch (error) {
            console.error('Error toggling source:', error);
            this.showNotification('Error de conexión al cambiar el estado de la fuente', 'error');
        }
    }

    async loadSourcePreview(sourceId) {
        try {
            this.showNotification('Cargando vista previa...', 'info');
            
            const response = await fetch(`${this.apiUrl}/datasets/sources/${sourceId}/load`, {
                method: 'POST'
            });
            
            if (!response.ok) throw new Error('Failed to load source preview');
            
            const result = await response.json();
            
            if (result.success && result.data.data) {
                this.showSourcePreview(result.data.data);
                this.showNotification(result.data.message, 'success');
            } else {
                this.showNotification(result.message || 'Error al cargar la vista previa', 'error');
            }
            
        } catch (error) {
            console.error('Error loading source preview:', error);
            this.showNotification('Error de conexión al cargar la vista previa', 'error');
        }
    }

    showSourcePreview(data) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-semibold text-gray-800">
                            <i class="fas fa-eye text-blue-500 mr-2"></i>
                            Vista Previa: ${data.source.name}
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <div class="text-sm text-gray-600 mt-2">
                        Total de entradas: ${data.totalEntries.toLocaleString('es-ES')} 
                        (mostrando ${data.loadedEntries})
                    </div>
                </div>
                <div class="p-6 overflow-y-auto max-h-96">
                    <div class="space-y-4">
                        ${data.preview.map((entry, index) => `
                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div class="text-sm font-medium text-gray-600 mb-1">Wayuu (guc):</div>
                                        <div class="text-gray-800">${entry.row.guc}</div>
                                    </div>
                                    <div>
                                        <div class="text-sm font-medium text-gray-600 mb-1">Español (es):</div>
                                        <div class="text-gray-800">${entry.row.es}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="p-6 border-t border-gray-200 bg-gray-50">
                    <div class="flex justify-end">
                        <button onclick="this.closest('.fixed').remove()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showSourcesError() {
        const container = document.getElementById('sources-container');
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                <div>Error al cargar las fuentes</div>
                <button onclick="translator.loadSources()" class="mt-2 text-sm text-blue-600 hover:text-blue-800">
                    Reintentar
                </button>
            </div>
        `;
    }

    // ==================== AUDIO PLAYER METHODS ====================

    async searchAudio() {
        const query = document.getElementById('audio-search').value.trim();
        
        if (!query) {
            this.showNotification('Por favor ingresa una palabra para buscar', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/datasets/audio/search?query=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const searchData = await response.json();
            this.displayAudioSearchResults(searchData);
            
        } catch (error) {
            console.error('Audio search error:', error);
            this.showNotification('Error al buscar audio. Por favor intenta de nuevo.', 'error');
        }
    }

    displayAudioSearchResults(searchData) {
        const resultsContainer = document.getElementById('audio-search-results');
        const resultsList = document.getElementById('audio-results-list');
        
        resultsList.innerHTML = '';
        
        if (!searchData.results || searchData.results.length === 0) {
            this.showNoAudioResults(searchData.query);
            return;
        }

        // Show results container
        resultsContainer.classList.remove('hidden');
        
        searchData.results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer';
            
            resultItem.innerHTML = `
                <div class="flex-1">
                    <div class="flex items-center space-x-3">
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-volume-up text-purple-600"></i>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-gray-900 truncate">
                                ID: ${result.audioId}
                            </div>
                            <div class="text-sm text-gray-600 mt-1">
                                ${result.transcription || 'Sin transcripción'}
                            </div>
                            ${result.duration ? `<div class="text-xs text-gray-500 mt-1">Duración: ${result.duration}s</div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex-shrink-0 ml-4">
                    <button class="play-audio-btn bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors">
                        <i class="fas fa-play text-sm"></i>
                    </button>
                </div>
            `;
            
            // Add click handler
            const playBtn = resultItem.querySelector('.play-audio-btn');
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playAudio(result.audioId, result);
            });
            
            resultItem.addEventListener('click', () => {
                this.playAudio(result.audioId, result);
            });
            
            resultsList.appendChild(resultItem);
        });
    }

    showNoAudioResults(query) {
        const resultsContainer = document.getElementById('audio-search-results');
        const resultsList = document.getElementById('audio-results-list');
        
        resultsList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-search text-gray-400 text-4xl mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
                <p class="text-gray-600">No hay grabaciones que contengan "${query}"</p>
                <div class="mt-4">
                    <button onclick="document.getElementById('audio-search').value = ''; this.parentElement.parentElement.parentElement.parentElement.classList.add('hidden');" 
                            class="text-purple-600 hover:text-purple-800 text-sm">
                        Limpiar búsqueda
                    </button>
                </div>
            </div>
        `;
        
        resultsContainer.classList.remove('hidden');
    }

    async playAudio(audioId, audioData) {
        const audioPlayer = document.getElementById('audio-player');
        const playerSection = document.getElementById('audio-player-section');
        
        // Update UI
        document.getElementById('current-audio-id').textContent = audioId;
        document.getElementById('current-transcription').textContent = audioData.transcription || 'Sin transcripción disponible';
        
        // Set audio source
        audioPlayer.src = `${this.apiUrl}/audio/files/${audioId}.wav`;
        
        // Update metadata
        document.getElementById('audio-duration').textContent = audioData.duration ? `${audioData.duration}s` : 'N/A';
        document.getElementById('audio-size').textContent = audioData.size || 'N/A';
        document.getElementById('audio-status').textContent = audioData.status || 'N/A';
        document.getElementById('audio-confidence').textContent = audioData.confidence ? `${Math.round(audioData.confidence * 100)}%` : 'N/A';
        
        // Show player
        playerSection.classList.remove('hidden');
        
        // Scroll to player
        playerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        try {
            await audioPlayer.load();
            // Optional: auto-play (some browsers block this)
            // audioPlayer.play();
        } catch (error) {
            console.error('Audio playback error:', error);
            this.showNotification('Error al cargar el audio', 'error');
        }
    }

    async playRandomAudio() {
        try {
            const response = await fetch(`${this.apiUrl}/datasets/audio/entries?limit=1&random=true`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.entries && data.entries.length > 0) {
                const randomAudio = data.entries[0];
                await this.playAudio(randomAudio.audioId, randomAudio);
                this.showNotification('Reproduciendo audio aleatorio', 'info');
            } else {
                this.showNotification('No hay audios disponibles', 'error');
            }
            
        } catch (error) {
            console.error('Random audio error:', error);
            this.showNotification('Error al obtener audio aleatorio', 'error');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 Wayuu-Spanish Translator con Autenticación iniciando...');
    
    // Check for authentication callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
        // Remove the auth parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show success message
        setTimeout(() => {
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm bg-green-100 text-green-800 border border-green-200';
            notification.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-check-circle mr-2"></i>
                    <span>¡Bienvenido! Has iniciado sesión correctamente.</span>
                    <button class="ml-auto pl-3" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }, 1000);
    }
    
    // Initialize the main application
    window.wayuuTranslator = new WayuuTranslator();
    console.log('✅ Aplicación iniciada con sistema de autenticación');
});
