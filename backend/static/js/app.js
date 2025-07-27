/**
 * Hlavní aplikační logika - správa tabů a obecná funkcionalita
 * Autor: GitHub Copilot
 * Datum: 27.7.2025
 */

class SkladovaApp {
    constructor() {
        this.activeTab = 'regaly';
        this.isInitialized = false;
        this.refreshCallbacks = {
            regaly: [],
            vyhledavani: []
        };
        
        this.initializeApp();
    }

    /**
     * Registrace callback funkce pro refreshování dat
     */
    registerRefreshCallback(tab, callback) {
        if (!this.refreshCallbacks[tab]) {
            this.refreshCallbacks[tab] = [];
        }
        this.refreshCallbacks[tab].push(callback);
        console.log(`✅ Registrován refresh callback pro tab: ${tab}`);
    }

    /**
     * Spuštění refreshu pro aktivní tab nebo všechny taby
     */
    async refreshData(tabName = null) {
        const tabsToRefresh = tabName ? [tabName] : [this.activeTab];
        
        console.log(`🔄 Spouštím refresh pro taby:`, tabsToRefresh);
        console.log(`📋 Dostupné callbacky:`, Object.keys(this.refreshCallbacks));
        
        for (const tab of tabsToRefresh) {
            console.log(`🔍 Kontroluji tab: ${tab}`);
            console.log(`📋 Callbacky pro ${tab}:`, this.refreshCallbacks[tab]);
            
            if (this.refreshCallbacks[tab] && this.refreshCallbacks[tab].length > 0) {
                console.log(`🔄 Refreshuji data pro tab: ${tab} (${this.refreshCallbacks[tab].length} callbacků)`);
                for (const callback of this.refreshCallbacks[tab]) {
                    try {
                        await callback();
                        console.log(`✅ Callback dokončen pro tab: ${tab}`);
                    } catch (error) {
                        console.error(`❌ Chyba při refreshu ${tab}:`, error);
                    }
                }
            } else {
                console.warn(`⚠️ Žádné callbacky pro tab: ${tab}`);
            }
        }
    }

    /**
     * Globální refresh všech tabů
     */
    async refreshAllTabs() {
        console.log('🔄 Refreshuji všechny taby');
        await this.refreshData('regaly');
        await this.refreshData('vyhledavani');
    }

    /**
     * Inicializace aplikace
     */
    async initializeApp() {
        try {
            this.initializeElements();
            this.initializeModals();
            this.attachEventListeners();
            await this.performHealthCheck();
            this.isInitialized = true;
            
            // Oznámíme ostatním komponentám, že aplikace je připravena
            const event = new CustomEvent('app-ready');
            document.dispatchEvent(event);
            console.log('🚀 Aplikace inicializována, spuštěn app-ready event');
            
            console.log('📦 Skladová aplikace úspěšně spuštěna');
        } catch (error) {
            console.error('Chyba při inicializaci aplikace:', error);
            showError('Chyba při spuštění aplikace: ' + error.message);
        }
    }

    /**
     * Inicializace modal systému
     */
    initializeModals() {
        // Modal manager je již globálně dostupný z modals.js
        if (window.modalManager) {
            // Inicializace Gitterbox modalu
            this.gitterboxModal = new GitterboxModal(window.modalManager);
            
            // Inicializace Item modalu
            this.itemModal = new ItemModal(window.modalManager);
            
            // Globální přístup pro debug
            window.gitterboxModal = this.gitterboxModal;
            window.itemModal = this.itemModal;
        }
    }

    /**
     * Inicializace DOM elementů
     */
    initializeElements() {
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = {
            regaly: document.getElementById('content-regaly'),
            vyhledavani: document.getElementById('content-vyhledavani')
        };
        this.refreshBtn = document.getElementById('refresh-btn');
    }

    /**
     * Připojení event listenerů
     */
    attachEventListeners() {
        // Tab navigation
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Refresh button
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                this.refreshActiveTab();
            });
        }

        // Nový Gitterbox button
        const newGbBtn = document.getElementById('btn-new-gb');
        if (newGbBtn) {
            newGbBtn.addEventListener('click', () => {
                if (this.gitterboxModal) {
                    this.gitterboxModal.openCreate();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window resize
        window.addEventListener('resize', debounce(() => {
            this.handleWindowResize();
        }, 250));

        // Unload warning pro neulozene zmeny
        window.addEventListener('beforeunload', (e) => {
            // V budoucnu: kontrola neuložených změn
        });
    }

    /**
     * Health check při spuštění
     */
    async performHealthCheck() {
        try {
            const response = await API.healthCheck();
            console.log('✅ Backend health check OK:', response);
        } catch (error) {
            console.warn('⚠️ Backend health check failed:', error);
            showError('Backend není dostupný. Zkontrolujte připojení.');
            throw error;
        }
    }

    /**
     * Přepnutí záložky
     */
    switchTab(tabName) {
        if (!this.tabContents[tabName]) {
            console.error('Neznámá záložka:', tabName);
            return;
        }

        // Aktualizace tlačítek
        this.tabButtons.forEach(button => {
            const isActive = button.dataset.tab === tabName;
            button.className = button.className
                .replace(/tab-(active|inactive)/g, '')
                .trim() + (isActive ? ' tab-active' : ' tab-inactive');
        });

        // Skrytí všech obsahů
        Object.values(this.tabContents).forEach(content => {
            content.classList.add('hidden');
        });

        // Zobrazení vybrané záložky
        this.tabContents[tabName].classList.remove('hidden');
        this.activeTab = tabName;

        // Callback pro specifické záložky
        this.onTabActivated(tabName);
    }

    /**
     * Callback při aktivaci záložky
     */
    onTabActivated(tabName) {
        switch (tabName) {
            case 'regaly':
                // Regály záložka je vždy načítána při startu
                break;
                
            case 'vyhledavani':
                // Focus na vyhledávací pole
                setTimeout(() => {
                    const searchInput = document.getElementById('search-input');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, 100);
                break;
        }
    }

    /**
     * Refresh aktuální záložky
     */
    async refreshActiveTab() {
        try {
            // Animace refresh buttonu
            if (this.refreshBtn) {
                this.refreshBtn.classList.add('fa-spin');
            }

            switch (this.activeTab) {
                case 'regaly':
                    if (window.regalyTab) {
                        await window.regalyTab.refresh();
                    }
                    break;
                    
                case 'vyhledavani':
                    if (window.vyhledavaniTab) {
                        await window.vyhledavaniTab.refresh();
                    }
                    break;
            }

            showSuccess('Data aktualizována');
            
        } catch (error) {
            showError('Chyba při aktualizaci: ' + error.message);
        } finally {
            // Zastavení animace
            if (this.refreshBtn) {
                setTimeout(() => {
                    this.refreshBtn.classList.remove('fa-spin');
                }, 500);
            }
        }
    }

    /**
     * Klávesové zkratky
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + číslo pro přepínání záložek
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.switchTab('regaly');
                    break;
                case '2':
                    e.preventDefault();
                    this.switchTab('vyhledavani');
                    break;
                case 'r':
                    e.preventDefault();
                    this.refreshActiveTab();
                    break;
            }
        }

        // F5 pro refresh aktuální záložky
        if (e.key === 'F5' && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            this.refreshActiveTab();
        }

        // Escape pro zavření modalů (později)
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    /**
     * Reakce na změnu velikosti okna
     */
    handleWindowResize() {
        // Pro budoucí responsive adjustments
        console.log('Window resized:', window.innerWidth, 'x', window.innerHeight);
    }

    /**
     * Zavření všech modalů
     */
    closeAllModals() {
        // Pro budoucí modal management
        console.log('Closing all modals');
    }

    /**
     * Globální error handler
     */
    handleGlobalError(error, context = '') {
        console.error('Global error:', error, context);
        showError(`Neočekávaná chyba: ${error.message}`);
    }

    /**
     * Získání informací o aplikaci
     */
    getAppInfo() {
        return {
            version: '1.0.0',
            activeTab: this.activeTab,
            initialized: this.isInitialized,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }
}

// === UTILITY FUNKCE ===

/**
 * Validace emailu
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validace českého telefonního čísla
 */
function isValidPhone(phone) {
    const phoneRegex = /^(\+420)?[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Formátování čísla s tisícovými oddělovači
 */
function formatNumber(number) {
    return new Intl.NumberFormat('cs-CZ').format(number);
}

/**
 * Generování náhodného ID
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Získání aktuálního českého data
 */
function getCurrentDate() {
    return new Date().toLocaleDateString('cs-CZ');
}

/**
 * Kopírování textu do schránky
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showSuccess('Text zkopírován do schránky');
    } catch (error) {
        console.error('Chyba při kopírování:', error);
        // Fallback pro starší prohlížeče
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('Text zkopírován do schránky');
    }
}

// === GLOBÁLNÍ ERROR HANDLING ===

window.addEventListener('error', (e) => {
    console.error('Uncaught error:', e.error);
    if (window.app) {
        window.app.handleGlobalError(e.error, 'uncaught');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (window.app) {
        window.app.handleGlobalError(e.reason, 'unhandled-promise');
    }
});

// === INICIALIZACE ===

// Čekáme na načtení DOMu a API modulu
document.addEventListener('DOMContentLoaded', () => {
    // Malé zpoždění pro načtení všech modulů
    setTimeout(() => {
        window.app = new SkladovaApp();
        
        // Debug informace do konzole
        console.log('🏗️ Aplikace inicializována');
        console.log('📋 Dostupné příkazy v konzoli:');
        console.log('  - app.getAppInfo() - informace o aplikaci');
        console.log('  - app.switchTab("regaly"|"vyhledavani") - přepnutí záložky');
        console.log('  - app.refreshActiveTab() - obnovení dat');
        console.log('  - regalyTab - přístup k regály modulu');
        console.log('  - vyhledavaniTab - přístup k vyhledávání modulu');
        console.log('🎮 Klávesové zkratky:');
        console.log('  - Ctrl+1 / Ctrl+2 - přepínání záložek');
        console.log('  - Ctrl+R / F5 - refresh dat');
        console.log('  - Escape - zavření modalů');
        
    }, 100);
});

// Export utility funkcí
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.formatNumber = formatNumber;
window.generateId = generateId;
window.getCurrentDate = getCurrentDate;
window.copyToClipboard = copyToClipboard;
