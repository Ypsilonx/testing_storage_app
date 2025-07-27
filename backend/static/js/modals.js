/**
 * Modal systém pro formuláře
 * Správa otevírání/zavírání formulářů a validace
 */

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.bindEvents();
    }

    bindEvents() {
        // ESC key pro zavření
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });

        // Click na overlay pro zavření
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
    }

    openModal(modalId) {
        this.closeModal(); // Zavři případný aktivní modal
        
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            this.activeModal = modal;
            document.body.style.overflow = 'hidden'; // Disable scroll
        }
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.classList.add('hidden');
            this.activeModal = null;
            document.body.style.overflow = ''; // Enable scroll
        }
    }

    showLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Ukládám...';
            return originalText;
        }
    }

    hideLoading(buttonId, originalText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    showError(message) {
        // Vytvoř error toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity';
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Automaticky odeber po 5 sekundách
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    }

    showSuccess(message) {
        // Vytvoř success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity';
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Automaticky odeber po 3 sekundách
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

/**
 * Gitterbox formulář modal
 */
class GitterboxModal {
    constructor(modalManager, apiClient) {
        this.modalManager = modalManager;
        this.api = apiClient;
        this.mode = 'create'; // 'create' nebo 'edit'
        this.editingGbId = null;
        this.availablePositions = [];
        
        this.createModal();
        this.bindEvents();
        this.loadAvailablePositions();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'gitterbox-modal';
        modal.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex justify-between items-center mb-6">
                        <h2 id="gb-modal-title" class="text-xl font-bold text-gray-900">
                            <i class="fas fa-cube text-blue-500 mr-2"></i>
                            Nový Gitterbox
                        </h2>
                        <button id="gb-modal-close" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <!-- Form -->
                    <form id="gitterbox-form">
                        <!-- Zodpovědná osoba -->
                        <div class="mb-4">
                            <label for="gb-zodpovedna-osoba" class="block text-sm font-medium text-gray-700 mb-2">
                                Zodpovědná osoba *
                            </label>
                            <input 
                                type="text" 
                                id="gb-zodpovedna-osoba" 
                                name="zodpovedna_osoba"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Jan Novák"
                                required
                            >
                        </div>

                        <!-- Pozice (dropdown) -->
                        <div class="mb-4">
                            <label for="gb-pozice" class="block text-sm font-medium text-gray-700 mb-2">
                                Pozice *
                            </label>
                            <select 
                                id="gb-pozice" 
                                name="position_id"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Vyberte pozici...</option>
                                <!-- Dynamicky naplněno -->
                            </select>
                        </div>

                        <!-- Naplněnost -->
                        <div class="mb-4">
                            <label for="gb-naplnenost" class="block text-sm font-medium text-gray-700 mb-2">
                                Naplněnost (%)
                            </label>
                            <input 
                                type="number" 
                                id="gb-naplnenost" 
                                name="naplnenost_procenta"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0" 
                                max="100" 
                                value="0"
                            >
                        </div>

                        <!-- Poznámka -->
                        <div class="mb-6">
                            <label for="gb-poznamka" class="block text-sm font-medium text-gray-700 mb-2">
                                Poznámka
                            </label>
                            <textarea 
                                id="gb-poznamka" 
                                name="poznamka"
                                rows="3"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Volitelná poznámka..."
                            ></textarea>
                        </div>

                        <!-- Buttons -->
                        <div class="flex space-x-3">
                            <button 
                                type="submit" 
                                id="gb-submit-btn"
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                <i class="fas fa-save mr-2"></i>
                                Uložit
                            </button>
                            <button 
                                type="button" 
                                id="gb-cancel-btn"
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                <i class="fas fa-times mr-2"></i>
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('modals-container').appendChild(modal);
    }

    bindEvents() {
        // Close buttons
        document.getElementById('gb-modal-close').addEventListener('click', () => {
            this.modalManager.closeModal();
        });
        
        document.getElementById('gb-cancel-btn').addEventListener('click', () => {
            this.modalManager.closeModal();
        });

        // Form submit
        document.getElementById('gitterbox-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    async loadAvailablePositions() {
        try {
            const positions = await this.api.getAvailablePositions();
            this.availablePositions = positions;
            this.updatePositionSelect();
        } catch (error) {
            console.error('Chyba při načítání pozic:', error);
        }
    }

    updatePositionSelect() {
        const select = document.getElementById('gb-pozice');
        
        // Vyčisti staré options
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Přidej dostupné pozice
        this.availablePositions.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos.id;
            
            // Format: "Lokace - Regál - Pozice (GB#XX)"
            const locationName = pos.shelf?.location?.nazev || 'N/A';
            const shelfName = pos.shelf?.nazev || 'N/A';
            const positionName = `${pos.radek}-${pos.sloupec}`;
            const gbNumber = this.getNextGbNumber(pos.id);
            
            option.textContent = `${locationName} - ${shelfName} - ${positionName} (GB#${gbNumber})`;
            
            select.appendChild(option);
        });
    }

    getNextGbNumber(positionId) {
        // Najdi pozici podle ID a získej GB číslo
        const position = this.availablePositions.find(p => p.id === positionId);
        if (position) {
            // GB číslo = pozice v celkovém pořadí (1-115)
            return this.calculateGlobalGbNumber(position);
        }
        return '?';
    }

    calculateGlobalGbNumber(position) {
        // TODO: Implementovat přesné vypočítání na základě pozice
        // Pro teď jednoduché číslo
        return position.id;
    }

    openCreate() {
        this.mode = 'create';
        this.editingGbId = null;
        
        document.getElementById('gb-modal-title').innerHTML = `
            <i class="fas fa-cube text-blue-500 mr-2"></i>
            Nový Gitterbox
        `;
        
        document.getElementById('gb-submit-btn').innerHTML = `
            <i class="fas fa-save mr-2"></i>
            Vytvořit
        `;

        // Reset form
        document.getElementById('gitterbox-form').reset();
        
        this.modalManager.openModal('gitterbox-modal');
    }

    openEdit(gb) {
        this.mode = 'edit';
        this.editingGbId = gb.id;
        
        document.getElementById('gb-modal-title').innerHTML = `
            <i class="fas fa-edit text-orange-500 mr-2"></i>
            Upravit GB #${gb.cislo_gb}
        `;
        
        document.getElementById('gb-submit-btn').innerHTML = `
            <i class="fas fa-save mr-2"></i>
            Uložit změny
        `;

        // Naplň form s existujícími daty
        document.getElementById('gb-zodpovedna-osoba').value = gb.zodpovedna_osoba || '';
        document.getElementById('gb-pozice').value = gb.position_id || '';
        document.getElementById('gb-naplnenost').value = gb.naplnenost_procenta || 0;
        document.getElementById('gb-poznamka').value = gb.poznamka || '';
        
        this.modalManager.openModal('gitterbox-modal');
    }

    async handleSubmit() {
        const formData = new FormData(document.getElementById('gitterbox-form'));
        const data = {
            zodpovedna_osoba: formData.get('zodpovedna_osoba'),
            position_id: parseInt(formData.get('position_id')),
            naplnenost_procenta: parseInt(formData.get('naplnenost_procenta')) || 0,
            poznamka: formData.get('poznamka') || null
        };

        // Validace
        if (!data.zodpovedna_osoba || !data.position_id) {
            this.modalManager.showError('Vyplňte všechna povinná pole');
            return;
        }

        const originalText = this.modalManager.showLoading('gb-submit-btn');

        try {
            let result;
            if (this.mode === 'create') {
                result = await this.api.createGitterbox(data);
                this.modalManager.showSuccess(`Gitterbox #${result.cislo_gb} byl úspěšně vytvořen`);
            } else {
                result = await this.api.updateGitterbox(this.editingGbId, data);
                this.modalManager.showSuccess(`Gitterbox #${result.cislo_gb} byl úspěšně aktualizován`);
            }

            this.modalManager.closeModal();
            
            // Refresh zobrazení
            if (window.regalyManager) {
                window.regalyManager.loadData();
            }
            
        } catch (error) {
            console.error('Chyba při ukládání GB:', error);
            this.modalManager.showError('Nepodařilo se uložit Gitterbox: ' + error.message);
        } finally {
            this.modalManager.hideLoading('gb-submit-btn', originalText);
        }
    }
}

/**
 * Položka formulář modal
 */
class ItemModal {
    constructor(modalManager, apiClient) {
        this.modalManager = modalManager;
        this.api = apiClient;
        this.mode = 'create'; // 'create' nebo 'edit'
        this.editingItemId = null;
        this.gitterboxId = null;
        
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'item-modal';
        modal.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex justify-between items-center mb-6">
                        <h2 id="item-modal-title" class="text-xl font-bold text-gray-900">
                            <i class="fas fa-box text-green-500 mr-2"></i>
                            Nová položka
                        </h2>
                        <button id="item-modal-close" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <!-- Form -->
                    <form id="item-form">
                        <!-- TMA číslo -->
                        <div class="mb-4">
                            <label for="item-tma" class="block text-sm font-medium text-gray-700 mb-2">
                                TMA číslo
                            </label>
                            <input 
                                type="text" 
                                id="item-tma" 
                                name="tma_cislo"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="TMA123456 (volitelné)"
                            >
                        </div>

                        <!-- Projekt -->
                        <div class="mb-4">
                            <label for="item-projekt" class="block text-sm font-medium text-gray-700 mb-2">
                                Projekt
                            </label>
                            <input 
                                type="text" 
                                id="item-projekt" 
                                name="projekt"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Název projektu (volitelné)"
                            >
                        </div>

                        <!-- Název dílu -->
                        <div class="mb-4">
                            <label for="item-nazev" class="block text-sm font-medium text-gray-700 mb-2">
                                Název dílu *
                            </label>
                            <input 
                                type="text" 
                                id="item-nazev" 
                                name="nazev_dilu"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Popis dílu nebo součástky"
                                required
                            >
                        </div>

                        <!-- Počet kusů a jednotka -->
                        <div class="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label for="item-pocet" class="block text-sm font-medium text-gray-700 mb-2">
                                    Počet *
                                </label>
                                <input 
                                    type="number" 
                                    id="item-pocet" 
                                    name="pocet_kusu"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="1" 
                                    value="1"
                                    required
                                >
                            </div>
                            <div>
                                <label for="item-jednotka" class="block text-sm font-medium text-gray-700 mb-2">
                                    Jednotka
                                </label>
                                <select 
                                    id="item-jednotka" 
                                    name="jednotka"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ks">ks</option>
                                    <option value="kg">kg</option>
                                    <option value="m">m</option>
                                    <option value="m²">m²</option>
                                    <option value="m³">m³</option>
                                    <option value="l">l</option>
                                    <option value="bal">bal</option>
                                    <option value="sada">sada</option>
                                </select>
                            </div>
                        </div>

                        <!-- Sledování expirace -->
                        <div class="mb-4">
                            <label class="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="item-sledovat-expiraci" 
                                    name="sledovat_expiraci"
                                    class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked
                                >
                                <span class="text-sm font-medium text-gray-700">
                                    Sledovat expiraci (automaticky za 1 rok)
                                </span>
                            </label>
                        </div>

                        <!-- Expiračn datum (volitelné) -->
                        <div class="mb-4" id="expiration-date-container">
                            <label for="item-expirace" class="block text-sm font-medium text-gray-700 mb-2">
                                Vlastní datum expirace
                            </label>
                            <input 
                                type="date" 
                                id="item-expirace" 
                                name="expiracni_datum"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                            <p class="text-xs text-gray-500 mt-1">
                                Ponechte prázdné pro automatickou expiraci za 1 rok
                            </p>
                        </div>

                        <!-- Poznámka -->
                        <div class="mb-6">
                            <label for="item-poznamka" class="block text-sm font-medium text-gray-700 mb-2">
                                Poznámka
                            </label>
                            <textarea 
                                id="item-poznamka" 
                                name="poznamka"
                                rows="2"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Volitelná poznámka..."
                            ></textarea>
                        </div>

                        <!-- Buttons -->
                        <div class="flex space-x-3">
                            <button 
                                type="submit" 
                                id="item-submit-btn"
                                class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                <i class="fas fa-save mr-2"></i>
                                Uložit
                            </button>
                            <button 
                                type="button" 
                                id="item-cancel-btn"
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                <i class="fas fa-times mr-2"></i>
                                Zrušit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('modals-container').appendChild(modal);
    }

    bindEvents() {
        // Close buttons
        document.getElementById('item-modal-close').addEventListener('click', () => {
            this.modalManager.closeModal();
        });
        
        document.getElementById('item-cancel-btn').addEventListener('click', () => {
            this.modalManager.closeModal();
        });

        // Form submit
        document.getElementById('item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Sledování expirace checkbox
        document.getElementById('item-sledovat-expiraci').addEventListener('change', (e) => {
            const container = document.getElementById('expiration-date-container');
            if (e.target.checked) {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
                document.getElementById('item-expirace').value = '';
            }
        });
    }

    openCreate(gitterboxId, gbNumber) {
        this.mode = 'create';
        this.editingItemId = null;
        this.gitterboxId = gitterboxId;
        
        document.getElementById('item-modal-title').innerHTML = `
            <i class="fas fa-box text-green-500 mr-2"></i>
            Nová položka do GB #${gbNumber}
        `;
        
        document.getElementById('item-submit-btn').innerHTML = `
            <i class="fas fa-save mr-2"></i>
            Přidat položku
        `;

        // Reset form
        document.getElementById('item-form').reset();
        document.getElementById('item-sledovat-expiraci').checked = true;
        document.getElementById('expiration-date-container').style.display = 'block';
        
        this.modalManager.openModal('item-modal');
    }

    openEdit(item) {
        this.mode = 'edit';
        this.editingItemId = item.id;
        this.gitterboxId = item.gitterbox_id;
        
        document.getElementById('item-modal-title').innerHTML = `
            <i class="fas fa-edit text-orange-500 mr-2"></i>
            Upravit položku
        `;
        
        document.getElementById('item-submit-btn').innerHTML = `
            <i class="fas fa-save mr-2"></i>
            Uložit změny
        `;

        // Naplň form s existujícími daty
        document.getElementById('item-tma').value = item.tma_cislo || '';
        document.getElementById('item-projekt').value = item.projekt || '';
        document.getElementById('item-nazev').value = item.nazev_dilu || '';
        document.getElementById('item-pocet').value = item.pocet_kusu || 1;
        document.getElementById('item-jednotka').value = item.jednotka || 'ks';
        document.getElementById('item-sledovat-expiraci').checked = item.sledovat_expiraci || false;
        document.getElementById('item-expirace').value = item.expiracni_datum || '';
        document.getElementById('item-poznamka').value = item.poznamka || '';
        
        // Update expiration container visibility
        const container = document.getElementById('expiration-date-container');
        container.style.display = item.sledovat_expiraci ? 'block' : 'none';
        
        this.modalManager.openModal('item-modal');
    }

    async handleSubmit() {
        const formData = new FormData(document.getElementById('item-form'));
        const data = {
            gitterbox_id: this.gitterboxId,
            tma_cislo: formData.get('tma_cislo') || null,
            projekt: formData.get('projekt') || null,
            nazev_dilu: formData.get('nazev_dilu'),
            pocet_kusu: parseInt(formData.get('pocet_kusu')) || 1,
            jednotka: formData.get('jednotka') || 'ks',
            sledovat_expiraci: formData.has('sledovat_expiraci'),
            expiracni_datum: formData.get('expiracni_datum') || null,
            poznamka: formData.get('poznamka') || null
        };

        // Validace
        if (!data.nazev_dilu) {
            this.modalManager.showError('Vyplňte název dílu');
            return;
        }

        const originalText = this.modalManager.showLoading('item-submit-btn');

        try {
            let result;
            if (this.mode === 'create') {
                result = await this.api.createItem(data);
                this.modalManager.showSuccess(`Položka "${result.nazev_dilu}" byla úspěšně přidána`);
            } else {
                result = await this.api.updateItem(this.editingItemId, data);
                this.modalManager.showSuccess(`Položka "${result.nazev_dilu}" byla úspěšně aktualizována`);
            }

            this.modalManager.closeModal();
            
            // Refresh zobrazení
            if (window.regalyManager) {
                window.regalyManager.loadData();
            }
            
        } catch (error) {
            console.error('Chyba při ukládání položky:', error);
            this.modalManager.showError('Nepodařilo se uložit položku: ' + error.message);
        } finally {
            this.modalManager.hideLoading('item-submit-btn', originalText);
        }
    }
}

// Global instances
window.modalManager = new ModalManager();
