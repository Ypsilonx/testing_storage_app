/**
 * API komunikace pro skladovou aplikaci
 * Autor: GitHub Copilot
 * Datum: 27.7.2025
 */

// Base URL pro API
const API_BASE_URL = '/api';

// Utility pro HTTP requesty
class ApiClient {
    
    /**
     * Obecný HTTP request s error handlingem
     */
    static async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, finalOptions);
            
            // Kontrola HTTP status
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorData}`);
            }

            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    static async get(endpoint) {
        return this.request(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    static async post(endpoint, data) {
        return this.request(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT request
     */
    static async put(endpoint, data) {
        return this.request(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     */
    static async delete(endpoint) {
        return this.request(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
        });
    }
}

// API metody pro konkrétní endpointy
const API = {
    
    // === STATISTIKY A KONFIGURACE ===
    
    /**
     * Získání základních statistik skladu
     */
    async getStatistics() {
        return ApiClient.get('/statistics');
    },

    /**
     * Získání konfigurace skladu
     */
    async getStorageConfig() {
        return ApiClient.get('/config/storage');
    },

    // === LOKACE A REGÁLY ===
    
    /**
     * Získání všech lokací s regály
     */
    async getLocations() {
        return ApiClient.get('/locations');
    },

    /**
     * Získání pozic konkrétního regálu
     */
    async getShelfPositions(shelfId) {
        return ApiClient.get(`/shelves/${shelfId}/positions`);
    },

    // === GITTERBOXY ===
    
    /**
     * Získání všech Gitterboxů
     */
    async getAllGitterboxes() {
        return ApiClient.get('/gitterboxes/');
    },

    /**
     * Získání konkrétního Gitterboxu
     */
    async getGitterbox(gbId) {
        return ApiClient.get(`/gitterboxes/${gbId}`);
    },

    /**
     * Vytvoření nového Gitterboxu
     */
    async createGitterbox(gbData) {
        return ApiClient.post('/gitterboxes/', gbData);
    },

    /**
     * Aktualizace Gitterboxu
     */
    async updateGitterbox(gbId, gbData) {
        return ApiClient.put(`/gitterboxes/${gbId}`, gbData);
    },

    /**
     * Smazání Gitterboxu
     */
    async deleteGitterbox(gbId) {
        return ApiClient.delete(`/gitterboxes/${gbId}`);
    },

    /**
     * Získání položek z Gitterboxu
     */
    async getGitterboxItems(gbId) {
        return ApiClient.get(`/gitterboxes/${gbId}/items`);
    },

    // === VYHLEDÁVÁNÍ ===
    
    /**
     * Fulltext vyhledávání
     */
    async search(query, filters = {}) {
        const params = new URLSearchParams();
        
        if (query) {
            params.append('q', query);
        }
        
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        });

        const queryString = params.toString();
        const endpoint = queryString ? `/search?${queryString}` : '/search';
        
        return ApiClient.get(endpoint);
    },

    // === HEALTH CHECK ===
    
    /**
     * Health check API
     */
    async healthCheck() {
        return ApiClient.get('/health');
    }
};

// Utility funkce pro UI

/**
 * Zobrazení loading stavu
 */
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

/**
 * Skrytí loading stavu
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Zobrazení error zprávy
 */
function showError(message, title = 'Chyba') {
    // Pro teď console.error, později modaly
    console.error(`${title}: ${message}`);
    
    // Dočasný alert (později nahradíme pěkným modalem)
    alert(`${title}: ${message}`);
}

/**
 * Zobrazení success zprávy
 */
function showSuccess(message, title = 'Úspěch') {
    console.log(`${title}: ${message}`);
    
    // Dočasný alert (později nahradíme pěkným modalem)
    // alert(`${title}: ${message}`);
}

/**
 * Formátování data pro zobrazení
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formátování data a času
 */
function formatDateTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Získání CSS třídy pro stav Gitterboxu
 */
function getGbStatusClass(gb) {
    if (gb.ma_kriticke_expirace) {
        return 'gb-kriticka';
    }
    
    switch (gb.stav) {
        case 'plny':
            return 'gb-plny';
        case 'aktivni':
            return 'gb-aktivni';
        default:
            return 'gb-aktivni';
    }
}

/**
 * Získání CSS třídy pro pozici na základě obsazenosti
 */
function getPositionStatusClass(pozice) {
    if (!pozice.gitterbox) {
        return 'gb-volna';
    }
    
    return getGbStatusClass(pozice.gitterbox);
}

/**
 * Debounce funkce pro omezení častých volání
 */
function debounce(func, wait) {
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
 * Escape HTML pro zabránění XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Export pro použití v jiných souborech
window.API = API;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showError = showError;
window.showSuccess = showSuccess;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.getGbStatusClass = getGbStatusClass;
window.getPositionStatusClass = getPositionStatusClass;
window.debounce = debounce;
window.escapeHtml = escapeHtml;
