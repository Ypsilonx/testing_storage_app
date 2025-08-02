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
    constructor(modalManager, apiClient = null) {
        this.modalManager = modalManager;
        // ApiClient je statická třída, takže nepoužíváme instanci
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
                        <button id="gb-modal-close" class="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 transition-colors">
                            <i class="fas fa-times text-2xl"></i>
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
                            <input 
                                type="text" 
                                id="gb-zodpovedna-osoba" 
                                name="zodpovedna_osoba"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Jan Novák"
                                required
                            >
                        </div>

                        <!-- Číslo GB -->
                        <div class="mb-4">
                            <label for="gb-cislo" class="block text-sm font-medium text-gray-700 mb-2">
                                Číslo Gitterboxu *
                            </label>
                            <div class="space-y-3">
                                <!-- Input pole pro číslo -->
                                <input 
                                    type="number" 
                                    id="gb-cislo" 
                                    name="cislo_gb"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Zadejte číslo GB (např. 1, 42, 100...)"
                                    min="1"
                                    required
                                >
                                
                                <!-- Horizontální pásek s volnými čísly -->
                                <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium text-gray-700">Volná čísla:</span>
                                        <button type="button" id="refresh-gb-numbers" class="text-sm text-blue-600 hover:text-blue-800" title="Obnovit">
                                            <i class="fas fa-sync-alt mr-1"></i>Obnovit
                                        </button>
                                    </div>
                                    <div id="available-numbers-strip" class="overflow-x-auto max-h-20">
                                        <div class="flex flex-wrap gap-1 min-w-max">
                                            <!-- Bude naplněno dynamicky -->
                                        </div>
                                    </div>
                                    <div id="gb-numbers-info" class="text-xs text-gray-500 mt-2">
                                        Načítám dostupná čísla...
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pozice (3-level dropdown) -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Pozice *
                            </label>
                            
                            <!-- Lokace -->
                            <div class="mb-2 relative">
                                <select 
                                    id="gb-lokace" 
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                    required
                                >
                                    <option value="">Vyberte lokaci...</option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <i class="fas fa-chevron-down text-gray-400 text-sm"></i>
                                </div>
                            </div>
                            
                            <!-- Regál -->
                            <div class="mb-2 relative">
                                <select 
                                    id="gb-regal" 
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                    required
                                    disabled
                                >
                                    <option value="">Nejdříve vyberte lokaci...</option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <i class="fas fa-chevron-down text-gray-400 text-sm"></i>
                                </div>
                            </div>
                            
                            <!-- Pozice -->
                            <div class="relative">
                                <select 
                                    id="gb-pozice" 
                                    name="position_id"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                    required
                                    disabled
                                >
                                    <option value="">Nejdříve vyberte regál...</option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <i class="fas fa-chevron-down text-gray-400 text-sm"></i>
                                </div>
                            </div>
                        </div>

                        <!-- Naplněnost -->
                        <div class="mb-4">
                            <label for="gb-naplnenost" class="block text-sm font-medium text-gray-700 mb-2">
                                Naplněnost (%)
                            </label>
                            <div class="relative">
                                <select 
                                    id="gb-naplnenost" 
                                    name="naplnenost_procenta"
                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
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
                                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <i class="fas fa-chevron-down text-gray-400 text-sm"></i>
                                </div>
                            </div>
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
        const refreshBtn = document.getElementById('refresh-gb-numbers');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAvailableGBNumbers();
            });
        }

        // 3-level dropdown cascade
        document.getElementById('gb-lokace').addEventListener('change', (e) => {
            this.onLocationChange(e.target.value);
        });

        document.getElementById('gb-regal').addEventListener('change', (e) => {
            // Rozliš mezi vytváření a editací
            if (this.mode === 'edit' && this.editingGbId) {
                // Při editaci používej metodu, která umožňuje změnu pozice
                this.onShelfChangeForEdit(e.target.value, this.currentPositionId);
            } else {
                // Při vytváření používej standardní metodu
                this.onShelfChange(e.target.value);
            }
        });
        
        // Validace GB čísla při psaní
        document.getElementById('gb-cislo').addEventListener('input', (e) => {
            this.validateGbNumber(e.target.value);
        });
    }

    async loadAvailablePositions() {
        try {
            const response = await API.getLocations();
            this.locations = response.data; // Použij response.data místo response
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
            const response = await API.getShelfPositions(shelfId);
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

    async onShelfChangeForEdit(shelfId, currentPositionId = null) {
        const poziceSelect = document.getElementById('gb-pozice');
        
        // Reset pozice
        poziceSelect.innerHTML = '<option value="">Vyberte pozici...</option>';
        
        if (!shelfId) {
            poziceSelect.disabled = true;
            return;
        }

        try {
            // Načti VŠECHNY pozice pro regál (i obsazené)
            const response = await API.getShelfPositions(shelfId);
            const positions = response.data.pozice;
            
            positions.forEach(pos => {
                const option = document.createElement('option');
                option.value = pos.id;
                
                // Zobraz jen aktuální a volné pozice
                if (pos.id === currentPositionId) {
                    // Aktuální pozice - vždy dostupná
                    option.textContent = `Pozice ${pos.nazev} (aktuální)`;
                    poziceSelect.appendChild(option);
                } else if (!pos.gitterbox) {
                    // Volná pozice - dostupná
                    option.textContent = `Pozice ${pos.nazev}`;
                    poziceSelect.appendChild(option);
                }
                // Obsazené pozice úplně vynecháme
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
        this.currentPositionId = null; // Vyčisti při vytváření
        
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
        
        // Obnov GB číslo input pro nový záznam
        const gbCisloInput = document.getElementById('gb-cislo');
        gbCisloInput.disabled = false;
        gbCisloInput.setAttribute('required', 'required'); // Obnov required atribut
        gbCisloInput.classList.remove('bg-gray-100', 'text-gray-600');
        
        // Zobraz pásek s čísly a refresh button
        const numbersStrip = document.getElementById('available-numbers-strip');
        const numbersInfo = document.getElementById('gb-numbers-info');
        const refreshBtn = document.getElementById('refresh-gb-numbers');
        if (numbersStrip) numbersStrip.style.display = 'block';
        if (refreshBtn) refreshBtn.style.display = 'inline';
        
        // Načti volná čísla GB pro pásek
        await this.loadAvailableGBNumbers();
        
        // Reset dropdowns až po načtení pozic
        await this.loadAvailablePositions();
        document.getElementById('gb-regal').disabled = true;
        document.getElementById('gb-pozice').disabled = true;
        document.getElementById('gb-regal').innerHTML = '<option value="">Nejdříve vyberte lokaci...</option>';
        document.getElementById('gb-pozice').innerHTML = '<option value="">Nejdříve vyberte regál...</option>';
        
        this.modalManager.openModal('gitterbox-modal');
        
        // Pokud máme předvybranou pozici, automaticky ji nastav (TEPRVE PO otevření)
        if (preselectedPositionId) {
            setTimeout(() => {
                this.preselectPosition(preselectedPositionId);
            }, 100);
        }
    }

    async preselectPosition(positionId) {
        try {
            // Debug log
            console.log('🔍 Předvybírám pozici:', positionId);
            console.log('🔍 API object:', window.API);
            console.log('🔍 API.getPosition:', window.API?.getPosition);
            
            // Získej detail pozice podle ID
            const response = await API.getPosition(positionId);
            console.log('✅ Position response:', response);
            const position = response.data;
            
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
        this.currentPositionId = gb.position_id; // Uloži aktuální pozici pro pozdější použití
        
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
        
        // Nastav GB číslo a zakáž editaci
        const gbCisloInput = document.getElementById('gb-cislo');
        gbCisloInput.value = gb.cislo_gb;
        gbCisloInput.disabled = true;
        gbCisloInput.removeAttribute('required'); // Odstraň required pro disabled field
        gbCisloInput.classList.add('bg-gray-100', 'text-gray-600');
        
        // Skryj pásek s čísly při editaci
        const numbersStrip = document.getElementById('available-numbers-strip');
        const numbersInfo = document.getElementById('gb-numbers-info');
        const refreshBtn = document.getElementById('refresh-gb-numbers');
        if (numbersStrip) numbersStrip.style.display = 'none';
        if (numbersInfo) numbersInfo.textContent = 'Číslo GB nelze při úpravě měnit';
        if (refreshBtn) refreshBtn.style.display = 'none';
        
        // Resetuj a nastav dropdowns
        await this.loadAvailablePositions();
        
        // Nastav současnou pozici
        if (gb.position_id && gb.lokace && gb.regal) {
            console.log('🔍 Předvybírám pozici pro editaci:', {
                position_id: gb.position_id,
                lokace: gb.lokace,
                regal: gb.regal
            });
            
            // Najdi lokaci podle názvu
            const locationSelect = document.getElementById('gb-lokace');
            for (let option of locationSelect.options) {
                if (option.text === gb.lokace) {
                    locationSelect.value = option.value;
                    console.log('✅ Lokace nalezena:', option.text);
                    break;
                }
            }
            
            // Načti regály pro vybranou lokaci
            if (locationSelect.value) {
                await this.onLocationChange(locationSelect.value);
                
                // Najdi regál podle názvu (hledej začátek textu)
                const regalSelect = document.getElementById('gb-regal');
                for (let option of regalSelect.options) {
                    // Porovnej jen název regálu, ignoruj rozměr v závorce
                    if (option.text.startsWith(gb.regal)) {
                        regalSelect.value = option.value;
                        console.log('✅ Regál nalezen:', option.text);
                        break;
                    }
                }
                
                // Načti pozice pro vybraný regál - použij metodu pro editaci
                if (regalSelect.value) {
                    await this.onShelfChangeForEdit(regalSelect.value, gb.position_id);
                    
                    // Nastav současnou pozici
                    document.getElementById('gb-pozice').value = gb.position_id;
                    console.log('✅ Pozice nastavena:', gb.position_id);
                }
            }
        }
        
        this.modalManager.openModal('gitterbox-modal');
    }

    async handleSubmit() {
        const formData = new FormData(document.getElementById('gitterbox-form'));
        
        // Při editaci, pokud je GB číslo disabled, vezmi ho z input value
        const gbCisloInput = document.getElementById('gb-cislo');
        const cisloGb = gbCisloInput.disabled ? 
            parseInt(gbCisloInput.value) : 
            parseInt(formData.get('cislo_gb'));
            
        const data = {
            cislo_gb: cisloGb,
            zodpovedna_osoba: formData.get('zodpovedna_osoba'),
            position_id: parseInt(formData.get('position_id')),
            naplnenost_procenta: parseInt(formData.get('naplnenost_procenta')) || 0,
            poznamka: formData.get('poznamka') || null
        };

        // Validace - číslo GB je povinné jen při vytváření
        if ((this.mode === 'create' && !data.cislo_gb) || !data.zodpovedna_osoba || !data.position_id) {
            this.modalManager.showError('Vyplňte všechna povinná pole');
            return;
        }

        // Validace rozsahu čísla GB jen pokud není disabled
        if (!gbCisloInput.disabled && data.cislo_gb < 1) {
            this.modalManager.showError('Číslo GB musí být alespoň 1');
            return;
        }

        const originalText = this.modalManager.showLoading('gb-submit-btn');

        try {
            let result;
            if (this.mode === 'create') {
                result = await API.createGitterbox(data);
                const gbNumber = result.data?.cislo_gb || result.cislo_gb || data.cislo_gb;
                this.modalManager.showSuccess(`Gitterbox #${gbNumber} byl úspěšně vytvořen`);
            } else {
                result = await API.updateGitterbox(this.editingGbId, data);
                const gbNumber = result.data?.cislo_gb || result.cislo_gb || data.cislo_gb;
                this.modalManager.showSuccess(`Gitterbox #${gbNumber} byl úspěšně aktualizován`);
            }

            this.modalManager.closeModal();
            
            // Použijeme centralizovaný refresh systém
            if (window.app && window.app.refreshAllTabs) {
                window.app.refreshAllTabs();
            } else {
                // Fallback na přímé volání manažerů
                if (window.regalyManager && window.regalyManager.refresh) {
                    window.regalyManager.refresh();
                }
                if (window.vyhledavaniTab && window.vyhledavaniTab.refresh) {
                    window.vyhledavaniTab.refresh();
                }
            }
            
        } catch (error) {
            console.error('Chyba při ukládání GB:', error);
            let errorMessage = 'Nepodařilo se uložit Gitterbox';
            
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.modalManager.showError(errorMessage);
        } finally {
            this.modalManager.hideLoading('gb-submit-btn', originalText);
        }
    }

    async loadAvailableGBNumbers() {
        const strip = document.getElementById('available-numbers-strip');
        const info = document.getElementById('gb-numbers-info');
        
        if (!strip || !info) {
            console.error('Elementy pro GB čísla nenalezeny');
            return;
        }
        
        try {
            // Zobrazit loading stav
            strip.innerHTML = '<div class="text-gray-500 text-sm">Načítám...</div>';
            info.textContent = 'Načítám dostupná čísla...';
            
            // Debug log
            console.log('🔍 Načítám volná čísla GB...');
            console.log('🔍 API object:', window.API);
            console.log('🔍 API.getAvailableGBNumbers:', window.API?.getAvailableGBNumbers);
            
            // Načti volná čísla GB z API
            const response = await API.getAvailableGBNumbers();
            console.log('✅ Response:', response);
            const data = response; // Response už obsahuje přímo data, ne zabalená
            
            if (data.volna_cisla.length === 0) {
                strip.innerHTML = '<div class="text-red-500 text-sm">Žádná volná čísla</div>';
                info.textContent = 'Všechna čísla GB jsou obsazená!';
                return;
            }
            
            // Vytvoř horizontální pásek s klikatelnými čísly
            const numbersContainer = document.createElement('div');
            numbersContainer.className = 'flex flex-wrap gap-1 min-w-max';
            
            // Zobraz všechna volná čísla (ne jen prvních 20)
            data.volna_cisla.slice(0, 50).forEach(cislo => { // Omezit na 50 pro performance
                const numberBtn = document.createElement('button');
                numberBtn.type = 'button';
                numberBtn.className = 'px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded border border-green-300 transition-colors';
                numberBtn.textContent = cislo;
                numberBtn.title = `Klikněte pro vybrání čísla ${cislo}`;
                
                numberBtn.addEventListener('click', () => {
                    document.getElementById('gb-cislo').value = cislo;
                    // Zvýrazni vybrané číslo
                    numbersContainer.querySelectorAll('button').forEach(btn => {
                        btn.classList.remove('bg-blue-500', 'text-white');
                        btn.classList.add('bg-green-100', 'text-green-800');
                    });
                    numberBtn.classList.remove('bg-green-100', 'text-green-800');
                    numberBtn.classList.add('bg-blue-500', 'text-white');
                });
                
                numbersContainer.appendChild(numberBtn);
            });
            
            strip.innerHTML = '';
            strip.appendChild(numbersContainer);
            
            // Aktualizuj info text
            const totalShown = Math.min(50, data.volna_cisla.length);
            info.textContent = `Volných čísel: ${data.celkem_volnych} z ${data.max_cislo} (zobrazeno prvních ${totalShown})`;
            
            console.log(`Načteno ${data.volna_cisla.length} volných GB čísel`);
            
        } catch (error) {
            console.error('Chyba při načítání volných čísel GB:', error);
            strip.innerHTML = '<div class="text-red-500 text-sm">Chyba při načítání</div>';
            info.textContent = 'Chyba při načítání čísel GB';
            
            // Zobrazit toast chybu
            if (this.modalManager) {
                this.modalManager.showError('Chyba při načítání čísel GB');
            }
        }
    }

    validateGbNumber(value) {
        const input = document.getElementById('gb-cislo');
        const info = document.getElementById('gb-numbers-info');
        
        if (!value || value === '') {
            input.classList.remove('border-red-500', 'border-green-500');
            input.classList.add('border-gray-300');
            return;
        }
        
        const num = parseInt(value);
        
        if (isNaN(num) || num < 1) {
            input.classList.remove('border-green-500', 'border-gray-300');
            input.classList.add('border-red-500');
            if (info) info.textContent = 'Číslo GB musí být alespoň 1';
            return;
        }
        
        // Zkontroluj proti seznamu obsazených čísel (asynchronně)
        this.checkNumberAvailability(num);
    }

    async checkNumberAvailability(number) {
        const input = document.getElementById('gb-cislo');
        const info = document.getElementById('gb-numbers-info');
        
        try {
            const response = await API.getAvailableGBNumbers();
            const data = response; // Opraveno - použij response přímo
            
            if (data.volna_cisla.includes(number)) {
                input.classList.remove('border-red-500', 'border-gray-300');
                input.classList.add('border-green-500');
                if (info) info.textContent = `✅ Číslo ${number} je volné`;
            } else {
                input.classList.remove('border-green-500', 'border-gray-300');
                input.classList.add('border-red-500');
                if (info) info.textContent = `❌ Číslo ${number} je již obsazené`;
            }
        } catch (error) {
            console.error('Chyba při kontrole dostupnosti čísla:', error);
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
                        <button id="item-modal-close" class="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 transition-colors">
                            <i class="fas fa-times text-2xl"></i>
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
                result = await API.createItem(data);
                const itemName = result.data?.nazev_dilu || result.nazev_dilu || data.nazev_dilu;
                this.modalManager.showSuccess(`Položka "${itemName}" byla úspěšně přidána`);
            } else {
                result = await API.updateItem(this.editingItemId, data);
                const itemName = result.data?.nazev_dilu || result.nazev_dilu || data.nazev_dilu;
                this.modalManager.showSuccess(`Položka "${itemName}" byla úspěšně aktualizována`);
            }

            this.modalManager.closeModal();
            
            // Použijeme centralizovaný refresh systém
            if (window.app && window.app.refreshAllTabs) {
                window.app.refreshAllTabs();
            } else {
                // Fallback na přímé volání manažerů
                if (window.regalyManager && window.regalyManager.refresh) {
                    window.regalyManager.refresh();
                }
                if (window.vyhledavaniTab && window.vyhledavaniTab.refresh) {
                    window.vyhledavaniTab.refresh();
                }
            }
            
        } catch (error) {
            console.error('Chyba při ukládání položky:', error);
            this.modalManager.showError('Nepodařilo se uložit položku: ' + error.message);
        } finally {
            this.modalManager.hideLoading('item-submit-btn', originalText);
        }
    }
}

/**
 * Modal pro vyskladnění (archivaci) položek a Gitterboxů
 */
class ArchiveModal {
    constructor() {
        this.modalManager = window.modalManager;
        this.itemId = null;
        this.gitterboxId = null;
        this.mode = null; // 'item' nebo 'gitterbox'
        this.availableReasons = {};
        this.bindEvents();
        this.loadReasons();
    }

    async loadReasons() {
        try {
            const response = await API.getVyskladneniDuvody();
            if (response.status === 'success') {
                this.availableReasons = response.data;
            }
        } catch (error) {
            console.error('Chyba při načítání důvodů:', error);
        }
    }

    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            this.createArchiveModal();
            
            // Submit handler
            const form = document.getElementById('archive-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSubmit();
                });
            }
        });
    }

    createArchiveModal() {
        const modalHtml = `
            <div id="archive-modal" class="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
                <div class="modal-content bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div class="modal-header px-6 py-4 border-b border-gray-200">
                        <h3 id="archive-modal-title" class="text-lg font-semibold text-gray-900">
                            <i class="fas fa-archive text-red-500 mr-2"></i>
                            Vyskladnit položku
                        </h3>
                        <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onclick="modalManager.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="archive-form" class="modal-body">
                        <div class="px-6 py-4 space-y-4">
                            <div>
                                <label for="archive-duvod" class="block text-sm font-medium text-gray-700 mb-2">
                                    Důvod vyskladnění <span class="text-red-500">*</span>
                                </label>
                                <select id="archive-duvod" name="duvod" required 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">-- Vyberte důvod --</option>
                                    <option value="expirace">📅 Expirace</option>
                                    <option value="rozbito">💥 Rozbito/Poškozeno</option>
                                    <option value="chyba">❌ Chyba/Špatně zaskladněno</option>
                                    <option value="jine">📝 Jiné</option>
                                </select>
                            </div>
                            
                            <div>
                                <label for="archive-poznamka" class="block text-sm font-medium text-gray-700 mb-2">
                                    Poznámka (volitelné)
                                </label>
                                <textarea id="archive-poznamka" name="poznamka" rows="3" 
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="Další podrobnosti o vyskladnění..."></textarea>
                            </div>
                            
                            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm text-yellow-700">
                                            <strong>Pozor:</strong> Vyskladnění trvale odstraní data z databáze.
                                            Informace budou archivovány do Excel souboru.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-footer px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                            <button type="button" onclick="modalManager.closeModal()" 
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                                <i class="fas fa-times mr-2"></i>
                                Zrušit
                            </button>
                            <button type="submit" id="archive-submit-btn"
                                    class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                                <i class="fas fa-archive mr-2"></i>
                                Vyskladnit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('modals-container').insertAdjacentHTML('beforeend', modalHtml);
    }

    openForItem(itemId, itemName) {
        this.mode = 'item';
        this.itemId = itemId;
        this.gitterboxId = null;
        
        document.getElementById('archive-modal-title').innerHTML = `
            <i class="fas fa-archive text-red-500 mr-2"></i>
            Vyskladnit položku: ${itemName}
        `;
        
        // Reset form
        document.getElementById('archive-form').reset();
        
        this.modalManager.openModal('archive-modal');
    }

    openForGitterbox(gitterboxId, gbNumber) {
        this.mode = 'gitterbox';
        this.gitterboxId = gitterboxId;
        this.itemId = null;
        
        document.getElementById('archive-modal-title').innerHTML = `
            <i class="fas fa-archive text-red-500 mr-2"></i>
            Vyskladnit celý Gitterbox #${gbNumber}
        `;
        
        // Reset form
        document.getElementById('archive-form').reset();
        
        this.modalManager.openModal('archive-modal');
    }

    async handleSubmit() {
        const duvod = document.getElementById('archive-duvod').value;
        const poznamka = document.getElementById('archive-poznamka').value;
        
        if (!duvod) {
            this.modalManager.showError('Vyberte důvod vyskladnění');
            return;
        }
        
        const originalText = document.getElementById('archive-submit-btn').innerHTML;
        this.modalManager.showLoading('archive-submit-btn');
        
        try {
            let response;
            
            if (this.mode === 'item') {
                response = await API.archiveItem(this.itemId, duvod, poznamka);
            } else if (this.mode === 'gitterbox') {
                response = await API.archiveGitterbox(this.gitterboxId, duvod, poznamka);
            }
            
            if (response.status === 'success') {
                this.modalManager.showSuccess(
                    this.mode === 'item' 
                        ? 'Položka byla úspěšně vyskladněna a archivována'
                        : 'Gitterbox byl úspěšně vyskladněn a archivován'
                );
                
                this.modalManager.closeModal();
                
                // Refresh všech záložek
                if (window.app && window.app.refreshAllTabs) {
                    window.app.refreshAllTabs();
                } else {
                    // Fallback na přímé volání manažerů
                    if (window.regalyManager && window.regalyManager.refresh) {
                        window.regalyManager.refresh();
                    }
                    if (window.vyhledavaniTab && window.vyhledavaniTab.refresh) {
                        window.vyhledavaniTab.refresh();
                    }
                }
            }
            
        } catch (error) {
            console.error('Chyba při vyskladnění:', error);
            this.modalManager.showError('Nepodařilo se vyskladnit: ' + error.message);
        } finally {
            this.modalManager.hideLoading('archive-submit-btn', originalText);
        }
    }
}

// Global instances
window.modalManager = new ModalManager();
window.archiveModal = new ArchiveModal();

// Export tříd pro použití v app.js
window.GitterboxModal = GitterboxModal;
window.ItemModal = ItemModal;
window.ArchiveModal = ArchiveModal;
