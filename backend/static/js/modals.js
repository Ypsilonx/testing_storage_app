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
            <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
                <div class="p-6 flex-shrink-0">
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
                </div>

                <!-- Scrollable Form Content -->
                <div class="flex-1 overflow-y-auto px-6">
                    <!-- Form -->
                    <form id="gitterbox-form">
                        <!-- Zodpovědná osoba -->
                        <div class="mb-4">
                            <label for="gb-zodpovedna-osoba" class="block text-sm font-medium text-gray-700 mb-2">
                                Zodpovědná osoba *
                            </label>
                            <div class="relative">
                                <input 
                                    type="text" 
                                    id="gb-zodpovedna-osoba" 
                                    name="zodpovedna_osoba"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Jan Novák nebo vyberte ze seznamu..."
                                    required
                                    list="employees-list"
                                >
                                <button type="button" id="show-employees-btn" class="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            <datalist id="employees-list">
                                <!-- TODO: Bude naplněno dynamicky ze seznamu zaměstnanců -->
                                <option value="Jan Novák (jnovak)">Jan Novák (jnovak)</option>
                                <option value="Marie Svoboda (msvoboda)">Marie Svoboda (msvoboda)</option>
                                <option value="Petr Dvořák (pdvorak)">Petr Dvořák (pdvorak)</option>
                                <option value="Anna Kratochvílová (akratochvilova)">Anna Kratochvílová (akratochvilova)</option>
                                <option value="Tomáš Procházka (tprochazka)">Tomáš Procházka (tprochazka)</option>
                            </datalist>
                        </div>

                        <!-- Číslo GB -->
                        <div class="mb-4">
                            <label for="gb-cislo" class="block text-sm font-medium text-gray-700 mb-2">
                                Číslo Gitterboxu *
                            </label>
                            <div class="relative">
                                <select 
                                    id="gb-cislo" 
                                    name="cislo_gb"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Vyberte číslo GB...</option>
                                    <!-- Bude naplněno dynamicky -->
                                </select>
                                <button type="button" id="refresh-gb-numbers" class="absolute right-8 top-2 text-gray-400 hover:text-gray-600" title="Obnovit seznam">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                Zobrazena jsou jen volná čísla GB (1-115)
                            </div>
                        </div>

                        <!-- Pozice (3-level dropdown) -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Pozice *
                            </label>
                            
                            <!-- Lokace -->
                            <div class="mb-2">
                                <select 
                                    id="gb-lokace" 
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Vyberte lokaci...</option>
                                </select>
                            </div>
                            
                            <!-- Regál -->
                            <div class="mb-2">
                                <select 
                                    id="gb-regal" 
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled
                                >
                                    <option value="">Nejdříve vyberte lokaci...</option>
                                </select>
                            </div>
                            
                            <!-- Pozice -->
                            <div>
                                <select 
                                    id="gb-pozice" 
                                    name="position_id"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled
                                >
                                    <option value="">Nejdříve vyberte regál...</option>
                                </select>
                            </div>
                        </div>

                        <!-- Naplněnost -->
                        <div class="mb-4">
                            <label for="gb-naplnenost" class="block text-sm font-medium text-gray-700 mb-2">
                                Naplněnost (%)
                            </label>
                            <select 
                                id="gb-naplnenost" 
                                name="naplnenost_procenta"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="0">0%</option>
                                <option value="10">10%</option>
                                <option value="20">20%</option>
                                <option value="30">30%</option>
                                <option value="40">40%</option>
                                <option value="50">50%</option>
                                <option value="60">60%</option>
                                <option value="70">70%</option>
                                <option value="80">80%</option>
                                <option value="90">90%</option>
                                <option value="100">100%</option>
                            </select>
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
                    </form>
                </div>

                <!-- Fixed Footer with Buttons -->
                <div class="p-6 border-t border-gray-200 flex-shrink-0">
                    <div class="flex space-x-3">
                        <button 
                            type="submit" 
                            id="gb-submit-btn"
                            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            form="gitterbox-form"
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

        // Refresh GB numbers button
        document.getElementById('refresh-gb-numbers').addEventListener('click', () => {
            this.loadAvailableGBNumbers();
        });

        // 3-level dropdown cascade
        document.getElementById('gb-lokace').addEventListener('change', (e) => {
            this.onLocationChange(e.target.value);
        });

        document.getElementById('gb-regal').addEventListener('change', (e) => {
            this.onShelfChange(e.target.value);
        });
    }

    async loadAvailablePositions() {
        try {
            const response = await this.api.getLocations();
            this.locations = response.data;
            this.updateLocationSelect();
        } catch (error) {
            console.error('Chyba při načítání lokací:', error);
        }
    }

    updateLocationSelect() {
        const select = document.getElementById('gb-lokace');
        
        // Vyčisti staré options
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Přidej lokace
        this.locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = location.nazev;
            select.appendChild(option);
        });
    }

    async onLocationChange(locationId) {
        const regalSelect = document.getElementById('gb-regal');
        const poziceSelect = document.getElementById('gb-pozice');
        
        // Reset dropdown
        regalSelect.innerHTML = '<option value="">Vyberte regál...</option>';
        poziceSelect.innerHTML = '<option value="">Nejdříve vyberte regál...</option>';
        poziceSelect.disabled = true;
        
        if (!locationId) {
            regalSelect.disabled = true;
            return;
        }

        // Načti regály pro lokaci
        const location = this.locations.find(l => l.id == locationId);
        if (location && location.regaly) {
            location.regaly.forEach(shelf => {
                const option = document.createElement('option');
                option.value = shelf.id;
                option.textContent = `${shelf.nazev} (${shelf.rozmer})`;
                regalSelect.appendChild(option);
            });
            regalSelect.disabled = false;
        }
    }

    async onShelfChange(shelfId) {
        const poziceSelect = document.getElementById('gb-pozice');
        
        // Reset pozice
        poziceSelect.innerHTML = '<option value="">Vyberte pozici...</option>';
        
        if (!shelfId) {
            poziceSelect.disabled = true;
            return;
        }

        try {
            // Načti dostupné pozice pro regál
            const response = await this.api.getShelfPositions(shelfId);
            const positions = response.data.pozice.filter(pos => !pos.gitterbox);
            
            if (positions.length === 0) {
                poziceSelect.innerHTML = '<option value="">Žádné volné pozice</option>';
                poziceSelect.disabled = true;
                return;
            }

            positions.forEach(pos => {
                const option = document.createElement('option');
                option.value = pos.id;
                option.textContent = `Pozice ${pos.nazev}`;
                poziceSelect.appendChild(option);
            });
            
            poziceSelect.disabled = false;
            
        } catch (error) {
            console.error('Chyba při načítání pozic:', error);
            poziceSelect.innerHTML = '<option value="">Chyba při načítání</option>';
            poziceSelect.disabled = true;
        }
    }

    async openCreate(preselectedPositionId = null) {
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
        
        // Načti volná čísla GB
        await this.loadAvailableGBNumbers();
        
        // Reset dropdowns
        document.getElementById('gb-regal').disabled = true;
        document.getElementById('gb-pozice').disabled = true;
        document.getElementById('gb-regal').innerHTML = '<option value="">Nejdříve vyberte lokaci...</option>';
        document.getElementById('gb-pozice').innerHTML = '<option value="">Nejdříve vyberte regál...</option>';
        
        this.modalManager.openModal('gitterbox-modal');
        
        // Pokud máme předvybranou pozici, automaticky ji nastav
        if (preselectedPositionId) {
            this.preselectPosition(preselectedPositionId);
        }
    }

    async preselectPosition(positionId) {
        try {
            // Najdi pozici podle ID
            const response = await this.api.getAllPositions();
            const position = response.data.find(p => p.id == positionId);
            
            if (position && position.shelf) {
                const locationId = position.shelf.location.id;
                const shelfId = position.shelf.id;
                
                // Nastav lokaci
                document.getElementById('gb-lokace').value = locationId;
                await this.onLocationChange(locationId);
                
                // Nastav regál (s malým delay)
                setTimeout(async () => {
                    document.getElementById('gb-regal').value = shelfId;
                    await this.onShelfChange(shelfId);
                    
                    // Nastav pozici (s dalším delay)
                    setTimeout(() => {
                        document.getElementById('gb-pozice').value = positionId;
                    }, 100);
                }, 100);
            }
        } catch (error) {
            console.error('Chyba při předvýběru pozice:', error);
        }
    }

    async openEdit(gb) {
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
        document.getElementById('gb-naplnenost').value = gb.naplnenost_procenta || 0;
        document.getElementById('gb-poznamka').value = gb.poznamka || '';
        
        // Resetuj a nastav dropdowns
        await this.loadLocations();
        
        // Nastav současnou pozici
        if (gb.position_id && gb.lokace && gb.regal) {
            // Najdi lokaci podle názvu
            const locationSelect = document.getElementById('gb-lokace');
            for (let option of locationSelect.options) {
                if (option.text === gb.lokace) {
                    locationSelect.value = option.value;
                    break;
                }
            }
            
            // Načti regály pro vybranou lokaci
            if (locationSelect.value) {
                await this.loadShelves(locationSelect.value);
                
                // Najdi regál podle názvu
                const regalSelect = document.getElementById('gb-regal');
                for (let option of regalSelect.options) {
                    if (option.text === gb.regal) {
                        regalSelect.value = option.value;
                        break;
                    }
                }
                
                // Načti pozice pro vybraný regál
                if (regalSelect.value) {
                    await this.loadPositions(regalSelect.value);
                    
                    // Nastav současnou pozici
                    document.getElementById('gb-pozice').value = gb.position_id;
                }
            }
        }
        
        this.modalManager.openModal('gitterbox-modal');
    }

    async handleSubmit() {
        const formData = new FormData(document.getElementById('gitterbox-form'));
        const data = {
            cislo_gb: parseInt(formData.get('cislo_gb')),
            zodpovedna_osoba: formData.get('zodpovedna_osoba'),
            position_id: parseInt(formData.get('position_id')),
            naplnenost_procenta: parseInt(formData.get('naplnenost_procenta')) || 0,
            poznamka: formData.get('poznamka') || null
        };

        // Validace
        if (!data.cislo_gb || !data.zodpovedna_osoba || !data.position_id) {
            this.modalManager.showError('Vyplňte všechna povinná pole včetně čísla GB');
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

    async loadAvailableGBNumbers() {
        const select = document.getElementById('gb-cislo');
        
        try {
            // Načti volná čísla GB z API
            const response = await this.api.get('/api/gitterboxes/available-numbers');
            const data = response.data;
            
            // Vyčisti dropdown
            select.innerHTML = '<option value="">Vyberte číslo GB...</option>';
            
            if (data.volna_cisla.length === 0) {
                select.innerHTML = '<option value="">Žádná volná čísla</option>';
                select.disabled = true;
                return;
            }
            
            // Přidej volná čísla
            data.volna_cisla.forEach(cislo => {
                const option = document.createElement('option');
                option.value = cislo;
                option.textContent = `GB #${cislo}`;
                select.appendChild(option);
            });
            
            select.disabled = false;
            
            // Aktualizuj info text
            const infoText = select.parentElement.parentElement.querySelector('.text-xs');
            if (infoText) {
                infoText.textContent = `Volných čísel: ${data.celkem_volnych} z ${data.max_cislo}`;
            }
            
        } catch (error) {
            console.error('Chyba při načítání volných čísel GB:', error);
            select.innerHTML = '<option value="">Chyba při načítání</option>';
            select.disabled = true;
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
            <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
                <div class="p-6 flex-shrink-0">
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
                </div>

                <!-- Scrollable Form Content -->
                <div class="flex-1 overflow-y-auto px-6">
                    <!-- Form -->
                    <form id="item-form">
                        <!-- TMA číslo -->
                        <div class="mb-4">
                            <label for="item-tma" class="block text-sm font-medium text-gray-700 mb-2">
                                TMA číslo
                            </label>
                            <div class="flex items-center space-x-2">
                                <div class="flex items-center bg-gray-100 px-3 py-2 rounded-l-lg border border-r-0 border-gray-300">
                                    <span class="text-sm text-gray-600 font-mono">EU-SVA-</span>
                                </div>
                                <input 
                                    type="text" 
                                    id="item-tma-middle" 
                                    class="flex-1 border-t border-b border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center"
                                    placeholder="000000"
                                    maxlength="6"
                                    pattern="[0-9]{6}"
                                >
                                <div class="flex items-center bg-gray-100 px-3 py-2 rounded-r-lg border border-l-0 border-gray-300">
                                    <span class="text-sm text-gray-600 font-mono">-25</span>
                                </div>
                            </div>
                            <input type="hidden" id="item-tma" name="tma_cislo">
                            <p class="text-xs text-gray-500 mt-1">
                                Vyplňte 6 číslic nebo ponechte prázdné pro položku bez TMA
                            </p>
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

                        <!-- Počet kusů -->
                        <div class="mb-4">
                            <label for="item-pocet" class="block text-sm font-medium text-gray-700 mb-2">
                                Počet kusů *
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
                            <input type="hidden" id="item-jednotka" name="jednotka" value="ks">
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
                                rows="3"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Volitelná poznámka..."
                            ></textarea>
                        </div>
                    </form>
                </div>

                <!-- Fixed Footer with Buttons -->
                <div class="p-6 border-t border-gray-200 flex-shrink-0">
                    <div class="flex space-x-3">
                        <button 
                            type="submit" 
                            id="item-submit-btn"
                            class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            form="item-form"
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

        // TMA číslo konstrukce
        document.getElementById('item-tma-middle').addEventListener('input', (e) => {
            const middlePart = e.target.value;
            const hiddenInput = document.getElementById('item-tma');
            
            if (middlePart && middlePart.length === 6) {
                hiddenInput.value = `EU-SVA-${middlePart}-25`;
            } else {
                hiddenInput.value = '';
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
        const tmaMiddle = item.tma_cislo ? item.tma_cislo.replace('EU-SVA-', '').replace('-25', '') : '';
        document.getElementById('item-tma-middle').value = tmaMiddle;
        document.getElementById('item-tma').value = item.tma_cislo || '';
        
        document.getElementById('item-projekt').value = item.projekt || '';
        document.getElementById('item-nazev').value = item.nazev_dilu || '';
        document.getElementById('item-pocet').value = item.pocet_kusu || 1;
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
