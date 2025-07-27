/**
 * Záložka REGÁLY - Vizualizace a správa regálů
 * Autor: GitHub Copilot  
 * Datum: 27.7.2025
 */

class RegalyTab {
    constructor() {
        this.currentLocation = null;
        this.currentShelf = null;
        this.selectedShelfId = 'all'; // Pro dropdown - 'all' nebo konkrétní shelf ID
        this.locations = [];
        this.shelves = [];
        this.positions = [];
        this.gitterboxes = [];
        this.recentGb = []; // Naposledy zobrazené GB
        this.allShelvesData = null; // Cache pro všechny regály
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadInitialData();
    }

    /**
     * Inicializace DOM elementů
     */
    initializeElements() {
        // Odstraněno locationSelector - používáme jen shelfSelector
        this.shelfSelector = document.getElementById('shelf-selector');
        this.shelfGrid = document.getElementById('shelf-grid');
        this.criticalList = document.getElementById('critical-list');
        this.recentGbList = document.getElementById('recent-gb'); // Změněno z gb-by-location
        this.newGbBtn = document.getElementById('btn-new-gb');
        this.quickSearchBtn = document.getElementById('btn-quick-search');
    }

    /**
     * Připojení event listenerů
     */
    attachEventListeners() {
        // Pouze shelf selector
        this.shelfSelector.addEventListener('change', (e) => {
            this.onShelfChange(e.target.value);
        });

        // Akční tlačítka
        this.newGbBtn.addEventListener('click', () => {
            this.showNewGbModal();
        });

        this.quickSearchBtn.addEventListener('click', () => {
            this.switchToSearchTab();
        });
    }

    /**
     * Načtení počátečních dat
     */
    async loadInitialData() {
        try {
            showLoading();
            
            // Paralelní načtení dat
            await Promise.all([
                this.loadLocations(),
                this.loadGitterboxes(),
                this.loadStatistics()
            ]);
            
            // Po načtení všech dat zobrazit přehled a aktualizovat statistiky
            this.populateShelfSelector();
            this.renderAllShelves();
            this.updateStatistics(); // Automatická aktualizace statistik
            
        } catch (error) {
            showError('Chyba při načítání dat: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    /**
     * Načtení lokací
     */
    async loadLocations() {
        try {
            const response = await API.getLocations();
            this.locations = response.data;
            
            // Parsuj rozměry regálů (z "3x9" na radky=3, sloupce=9)
            this.locations.forEach(location => {
                if (location.regaly) {
                    location.regaly.forEach(shelf => {
                        const [radky, sloupce] = shelf.rozmer.split('x').map(Number);
                        shelf.radky = radky;
                        shelf.sloupce = sloupce;
                    });
                }
            });
            
            // Populace shelf selectoru a renderování se dělá v loadInitialData
        } catch (error) {
            console.error('Chyba při načítání lokací:', error);
            throw error;
        }
    }

    /**
     * Načtení Gitterboxů
     */
    async loadGitterboxes() {
        try {
            const response = await API.getAllGitterboxes();
            this.gitterboxes = response.data || [];
            this.updateRecentGb(); // Změněno z updateGbByLocation
            this.updateCriticalList();
        } catch (error) {
            console.error('Chyba při načítání Gitterboxů:', error);
            throw error;
        }
    }

    /**
     * Načtení statistik
     */
    async loadStatistics() {
        try {
            const response = await API.getStatistics();
            this.updateStatistics(response.data);
        } catch (error) {
            console.error('Chyba při načítání statistik:', error);
            // Statistiky nejsou kritické, takže chybu jen logujeme
        }
    }

    /**
     * Naplnění selectoru regálů
     */
    populateShelfSelector() {
        this.shelfSelector.innerHTML = '<option value="all">🔍 Všechny regály</option>';
        this.shelfSelector.disabled = false;
        
        // Přidej všechny regály ze všech lokací
        this.locations.forEach(location => {
            if (location.regaly && location.regaly.length > 0) {
                // Group header pro lokaci
                const optgroup = document.createElement('optgroup');
                optgroup.label = `📍 ${location.nazev}`;
                
                location.regaly.forEach(shelf => {
                    const option = document.createElement('option');
                    option.value = shelf.id;
                    option.textContent = `${shelf.nazev} (${shelf.radky}×${shelf.sloupce})`;
                    optgroup.appendChild(option);
                });
                
                this.shelfSelector.appendChild(optgroup);
            }
        });
    }

    /**
     * Handler pro změnu regálu
     */
    async onShelfChange(shelfId) {
        this.selectedShelfId = shelfId;
        
        if (!shelfId || shelfId === 'all') {
            try {
                showLoading();
                await this.renderAllShelves();
            } catch (error) {
                showError('Chyba při načítání přehledu regálů: ' + error.message);
            } finally {
                hideLoading();
            }
            return;
        }

        try {
            showLoading();
            await this.loadShelfPositions(shelfId);
            this.renderSpecificShelf();
        } catch (error) {
            showError('Chyba při načítání pozic regálu: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    /**
     * Vykreslení konkrétního regálu v detailním zobrazení
     */
    renderSpecificShelf() {
        if (!this.currentShelf || !this.positions) {
            this.clearShelfGrid();
            return;
        }

        const { radky, sloupce } = this.currentShelf;
        
        // Najdi lokaci pro breadcrumb
        const location = this.locations.find(loc => 
            loc.regaly && loc.regaly.some(shelf => shelf.id === this.currentShelf.id)
        );
        
        // Vytvoření hlavičky s breadcrumb
        const headerHtml = `
            <div class="shelf-container bg-gray-700 rounded-lg p-6 border border-gray-500 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="text-xl font-semibold text-gray-100 flex items-center">
                        <i class="fas fa-map-marker-alt text-blue-400 mr-2"></i>
                        ${escapeHtml(location ? location.nazev : 'Neznámá lokace')} → ${escapeHtml(this.currentShelf.nazev)}
                    </h4>
                    <span class="text-sm text-gray-300 bg-gray-600 px-3 py-1 rounded">
                        ${radky}×${sloupce} pozic
                    </span>
                </div>
                <div class="grid gap-3 p-4 bg-gray-800 rounded" 
                     style="grid-template-columns: repeat(${sloupce}, minmax(0, 1fr));">
                    ${this.generateDetailedShelfGrid()}
                </div>
            </div>
        `;
        
        this.shelfGrid.innerHTML = headerHtml;
    }

    /**
     * Generování detailní mřížky pro konkrétní regál
     */
    generateDetailedShelfGrid() {
        const { radky, sloupce } = this.currentShelf;
        let grid = '';
        
        // Skladové číslování: 1-1 vlevo dole, číslujeme zdola nahoru
        for (let r = radky; r >= 1; r--) { // Změna: začínáme od nejvyššího řádku
            for (let c = 1; c <= sloupce; c++) {
                const position = this.positions.find(pos => pos.radek === r && pos.sloupec === c);
                const gb = position ? position.gitterbox : null;
                
                const cellClass = gb ? 'gb-pozice-aktivni' : 'gb-pozice-volna';
                
                // Stylizované tooltipy - jako čistý text pro data-tooltip
                const tooltip = gb ? 
                    `GB #${gb.cislo_gb}\n👨‍🔧: ${gb.zodpovedna_osoba}\n📦: ${gb.pocet_polozek || 0}\n📊: ${gb.naplnenost_procenta}%${gb.ma_kriticke_expirace ? '\n⚠ Kritická expirace' : ''}` : 
                    `Pozice ${position ? position.nazev : r+'-'+c}\nVolná pozice\nKlikněte pro nový GB`;
                
                grid += `
                    <div class="position-cell has-tooltip ${cellClass} h-16 flex flex-col justify-center items-center cursor-pointer hover:scale-105 transition-transform" 
                         data-custom-tooltip="${escapeHtml(tooltip)}"
                         onclick="regalyTab.showPositionDetail(${position?.id || 'null'}, ${gb?.cislo_gb || 'null'})">
                        <div class="text-sm font-bold">${gb ? gb.cislo_gb : '•'}</div>
                        <div class="text-xs text-gray-400">${gb ? gb.naplnenost_procenta + '%' : 'Volná'}</div>
                    </div>
                `;
            }
        }
        
        return grid;
    }

    /**
     * Načtení pozic konkrétního regálu
     */
    async loadShelfPositions(shelfId) {
        const response = await API.getShelfPositions(shelfId);
        this.currentShelf = response.data.regal;
        this.positions = response.data.pozice;
    }

    /**
     * Aktualizace seznamu kritických expirací
     */
    updateCriticalList() {
        const criticalGb = this.gitterboxes.filter(gb => gb.ma_kriticke_expirace);
        
        if (criticalGb.length === 0) {
            this.criticalList.innerHTML = `
                <div class="text-green-600 text-sm">
                    <i class="fas fa-check-circle mr-2"></i>
                    Žádné kritické expirace
                </div>
            `;
            return;
        }

        this.criticalList.innerHTML = criticalGb.map(gb => `
            <div class="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded cursor-pointer hover:bg-red-100" 
                 onclick="regalyTab.showGbDetail(${gb.cislo_gb})">
                <div>
                    <div class="font-medium text-red-800">GB #${gb.cislo_gb}</div>
                    <div class="text-xs text-red-600">${gb.zodpovedna_osoba}</div>
                </div>
                <i class="fas fa-exclamation-triangle text-red-500"></i>
            </div>
        `).join('');
    }

    /**
     * Aktualizace seznamu naposledy zobrazených GB
     */
    updateRecentGb() {
        if (!this.recentGbList) return;
        
        if (this.recentGb.length === 0) {
            this.recentGbList.innerHTML = `
                <div class="text-gray-500 text-sm italic">
                    Zatím žádné zobrazené GB
                </div>
            `;
            return;
        }

        // Zobrazit posledních 5 GB
        this.recentGbList.innerHTML = this.recentGb.slice(0, 5).map(gb => `
            <div class="flex items-center justify-between text-sm p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" 
                 onclick="regalyTab.showGbDetail(${gb.cislo_gb})">
                <div>
                    <span class="font-medium">GB #${gb.cislo_gb}</span>
                    <div class="text-xs text-gray-500">${escapeHtml(gb.zodpovedna_osoba)}</div>
                </div>
                <div class="text-xs text-gray-400">
                    ${gb.lokace} → ${gb.regal}
                </div>
            </div>
        `).join('');
    }

    /**
     * Přidání GB do recent historie
     */
    addToRecentGb(gb) {
        // Odstraň duplicity
        this.recentGb = this.recentGb.filter(recent => recent.id !== gb.id);
        // Přidej na začátek
        this.recentGb.unshift(gb);
        // Omez na 10 posledních
        this.recentGb = this.recentGb.slice(0, 10);
        // Aktualizuj UI
        this.updateRecentGb();
    }

    /**
     * Aktualizace statistik v headeru
     */
    updateStatistics() {
        const totalGbEl = document.getElementById('stats-total-gb');
        const criticalEl = document.getElementById('stats-critical');
        const utilizationEl = document.getElementById('stats-utilization');

        // Spočítej celkový počet pozic z načtených lokací
        let totalPositions = 0;
        if (this.locations && this.locations.length > 0) {
            this.locations.forEach(location => {
                if (location.regaly && location.regaly.length > 0) {
                    location.regaly.forEach(shelf => {
                        if (shelf.celkem_pozic) {
                            totalPositions += shelf.celkem_pozic;
                        }
                    });
                }
            });
        }

        // Aktualizuj elementy
        if (totalGbEl) {
            const activeGb = this.gitterboxes ? this.gitterboxes.length : 0;
            totalGbEl.textContent = `${activeGb}/${totalPositions}`;
        }
        
        if (criticalEl) {
            const criticalCount = this.gitterboxes ? 
                this.gitterboxes.filter(gb => gb.ma_kriticke_expirace).length : 0;
            criticalEl.textContent = criticalCount;
        }
        
        if (utilizationEl && totalPositions > 0) {
            const activeGb = this.gitterboxes ? this.gitterboxes.length : 0;
            const utilization = Math.round((activeGb / totalPositions) * 100);
            utilizationEl.textContent = `${utilization}%`;
        }
    }

    /**
     * Zobrazení detailu pozice/GB
     */
    showPositionDetail(poziceId, gbCislo) {
        if (gbCislo) {
            // Zobrazit detail GB a přidat do recent
            const gb = this.gitterboxes.find(g => g.cislo_gb === gbCislo);
            if (gb) {
                this.addToRecentGb(gb);
                this.showGbDetail(gb.cislo_gb);
            }
        } else {
            // Zobrazit možnost vytvoření nového GB na této pozici
            if (poziceId) {
                this.showNewGbModal(poziceId);
            }
        }
    }

    /**
     * Zobrazení detailu Gitterboxu
     */
    async showGbDetail(cisloGb) {
        try {
            showLoading();
            const gb = this.gitterboxes.find(g => g.cislo_gb == cisloGb);
            if (!gb) {
                showError('Gitterbox nebyl nalezen');
                return;
            }

            const itemsResponse = await API.getGitterboxItems(gb.id);
            const items = itemsResponse.data.polozky;
            
            // Vytvoř detail modal
            this.createGbDetailModal(gb, items);
            
        } catch (error) {
            showError('Chyba při načítání detailu GB: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    /**
     * Vytvoření detailního modalu pro GB
     */
    createGbDetailModal(gb, items) {
        // Odstranit existující modal pokud existuje
        const existingModal = document.getElementById('gb-detail-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'gb-detail-modal';
        modal.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div class="p-6 flex-shrink-0">
                    <!-- Header -->
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold text-gray-900">
                            <i class="fas fa-cube text-blue-500 mr-2"></i>
                            Detail GB #${gb.cislo_gb}
                        </h2>
                        <button id="gb-detail-close" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <!-- GB Info -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm text-gray-600">Zodpovědná osoba</p>
                                <p class="font-medium">${gb.zodpovedna_osoba}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Pozice</p>
                                <p class="font-medium">${gb.lokace} > ${gb.regal} > ${gb.radek}-${gb.sloupec}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Naplněnost</p>
                                <p class="font-medium">${gb.naplnenost_procenta}%</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Datum založení</p>
                                <p class="font-medium">${formatDate(gb.datum_zalozeni)}</p>
                            </div>
                        </div>
                        ${gb.poznamka ? `
                            <div class="mt-3">
                                <p class="text-sm text-gray-600">Poznámka</p>
                                <p class="font-medium">${gb.poznamka}</p>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Action buttons -->
                    <div class="flex space-x-3 mb-6">
                        <button id="edit-gb-btn" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-edit mr-2"></i>
                            Upravit GB
                        </button>
                        <button id="add-item-btn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            Přidat položku
                        </button>
                        <button id="copy-gb-info-btn" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-copy mr-2"></i>
                            Kopírovat info
                        </button>
                    </div>

                    <!-- Items header -->
                    <h3 class="text-lg font-semibold mb-3">
                        Položky (${items.length})
                    </h3>
                </div>

                <!-- Scrollable Items List -->
                <div class="flex-1 overflow-y-auto px-6">
                    ${items.length > 0 ? `
                        <div class="space-y-2 pb-4">
                            ${items.map(item => `
                                <div class="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <h4 class="font-medium text-gray-900">${item.nazev_dilu}</h4>
                                            <div class="text-sm text-gray-600 mt-1">
                                                ${item.tma_cislo ? `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">TMA: ${item.tma_cislo}</span>` : ''}
                                                ${item.projekt ? `<span class="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">${item.projekt}</span>` : ''}
                                                <span class="font-medium">${item.popis_mnozstvi}</span>
                                            </div>
                                            ${item.sledovat_expiraci && item.expiracni_datum ? `
                                                <div class="text-xs mt-2 ${item.je_blizko_expirace ? 'text-red-600' : 'text-gray-500'}">
                                                    <i class="fas fa-calendar mr-1"></i>
                                                    Expirace: ${formatDate(item.expiracni_datum)}
                                                    ${item.dny_do_expirace !== null ? ` (${item.dny_do_expirace} dní)` : ''}
                                                </div>
                                            ` : ''}
                                        </div>
                                        <button class="edit-item-btn text-gray-400 hover:text-orange-600 ml-2" data-item-id="${item.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-box-open text-4xl mb-3 text-gray-300"></i>
                            <p>Zatím žádné položky</p>
                            <button id="add-first-item-btn" class="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                                <i class="fas fa-plus mr-2"></i>
                                Přidat první položku
                            </button>
                        </div>
                    `}
                </div>

                <!-- Fixed Footer -->
                <div class="p-6 border-t border-gray-200 flex-shrink-0">
                    <div class="text-center">
                        <button id="gb-detail-close-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors">
                            <i class="fas fa-times mr-2"></i>
                            Zavřít
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const closeModal = () => {
            modal.remove();
        };

        document.getElementById('gb-detail-close').addEventListener('click', closeModal);
        document.getElementById('gb-detail-close-btn').addEventListener('click', closeModal);
        
        // Click na overlay pro zavření
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Edit GB button
        document.getElementById('edit-gb-btn').addEventListener('click', () => {
            closeModal();
            this.showEditGbModal(gb);
        });

        // Add item buttons
        const addItemBtn = document.getElementById('add-item-btn');
        const addFirstItemBtn = document.getElementById('add-first-item-btn');
        
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => {
                closeModal();
                this.showAddItemModal(gb.id, gb.cislo_gb);
            });
        }
        
        if (addFirstItemBtn) {
            addFirstItemBtn.addEventListener('click', () => {
                closeModal();
                this.showAddItemModal(gb.id, gb.cislo_gb);
            });
        }

        // Edit item buttons
        document.querySelectorAll('.edit-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.currentTarget.dataset.itemId);
                const item = items.find(i => i.id === itemId);
                if (item) {
                    closeModal();
                    this.showEditItemModal(item);
                }
            });
        });

        // Copy GB info button
        document.getElementById('copy-gb-info-btn').addEventListener('click', () => {
            const info = `GB #${gb.cislo_gb} - ${gb.zodpovedna_osoba} - ${gb.lokace} > ${gb.regal} > ${gb.radek}-${gb.sloupec} - ${gb.naplnenost_procenta}%`;
            copyToClipboard(info);
        });

        // ESC key pro zavření
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * Zobrazení modalu pro nový GB
     */
    showNewGbModal(poziceId = null) {
        if (window.gitterboxModal) {
            window.gitterboxModal.openCreate(poziceId);
        } else {
            // Fallback pro případ, že modal není inicializovaný
            const osoba = prompt('Zadejte zodpovědnou osobu:');
            if (!osoba) return;

            const poznamka = prompt('Poznámka (volitelné):') || '';

            this.createNewGb({ 
                zodpovedna_osoba: osoba, 
                poznamka: poznamka 
            });
        }
    }

    /**
     * Zobrazení modalu pro úpravu GB
     */
    showEditGbModal(gb) {
        if (window.gitterboxModal) {
            window.gitterboxModal.openEdit(gb);
        } else {
            showError('Modal systém není dostupný');
        }
    }

    /**
     * Zobrazení modalu pro přidání položky
     */
    showAddItemModal(gitterboxId, gbNumber) {
        if (window.itemModal) {
            window.itemModal.openCreate(gitterboxId, gbNumber);
        } else {
            showError('Modal systém není dostupný');
        }
    }

    /**
     * Zobrazení modalu pro úpravu položky
     */
    showEditItemModal(item) {
        if (window.itemModal) {
            window.itemModal.openEdit(item);
        } else {
            showError('Modal systém není dostupný');
        }
    }

    /**
     * Vytvoření nového Gitterboxu
     */
    async createNewGb(gbData) {
        try {
            showLoading();
            const response = await API.createGitterbox(gbData);
            showSuccess(`Gitterbox #${response.cislo_gb} byl úspěšně vytvořen`);
            
            // Obnovení dat
            await this.loadGitterboxes();
            
            // Pokud máme vybraný regál, obnovíme pozice
            if (this.shelfSelector.value && this.shelfSelector.value !== 'all') {
                await this.loadShelfPositions(this.shelfSelector.value);
                this.renderSpecificShelf();
            } else if (this.shelfSelector.value === 'all') {
                await this.renderAllShelves();
            }
            
        } catch (error) {
            showError('Chyba při vytváření Gitterboxu: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    /**
     * Přepnutí na záložku vyhledávání
     */
    switchToSearchTab() {
        const searchTab = document.getElementById('tab-vyhledavani');
        if (searchTab) {
            searchTab.click();
        }
    }

    /**
     * Vymazání selectoru regálů
     */
    clearShelfSelector() {
        this.shelfSelector.innerHTML = '<option value="">Vyberte regál...</option>';
        this.shelfSelector.disabled = true;
    }

    /**
     * Vymazání regálové mřížky
     */
    clearShelfGrid() {
        this.shelfGrid.innerHTML = `
            <div class="col-span-full flex items-center justify-center text-gray-500 text-center py-12">
                <div>
                    <i class="fas fa-warehouse text-4xl mb-4 text-gray-300"></i>
                    <p>Vyberte lokaci a regál pro zobrazení pozic</p>
                </div>
            </div>
        `;
        this.shelfGrid.className = '';
    }

    /**
     * Vykreslení všech regálů v přehledu - pod sebou s pozicemi
     */
    async renderAllShelves() {
        if (!this.shelfGrid) return;
        
        // Zobraz loading stav
        this.shelfGrid.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="text-gray-400">
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                    Načítání regálů...
                </div>
            </div>
        `;
        
        // Načti pozice pro všechny regály pokud ještě nejsou načtené
        if (!this.allShelvesData) {
            this.allShelvesData = [];
            
            for (const location of this.locations) {
                if (location.regaly) {
                    for (const shelf of location.regaly) {
                        try {
                            const response = await API.getShelfPositions(shelf.id);
                            this.allShelvesData.push({
                                shelf: shelf,
                                location: location,
                                positions: response.data.pozice || []
                            });
                        } catch (error) {
                            console.warn(`Chyba při načítání pozic pro regál ${shelf.nazev}:`, error);
                            // Přidej prázdné pozice aby se regál zobrazil
                            this.allShelvesData.push({
                                shelf: shelf,
                                location: location,
                                positions: []
                            });
                        }
                    }
                }
            }
        }
        
        // Vykresli všechny regály
        this.shelfGrid.innerHTML = `
            <div class="space-y-8">
                ${this.allShelvesData.map(item => `
                    <div class="shelf-container bg-gray-700 rounded-lg p-6 border border-gray-500">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-xl font-semibold text-gray-100 flex items-center">
                                <i class="fas fa-map-marker-alt text-blue-400 mr-2"></i>
                                ${escapeHtml(item.location.nazev)} → ${escapeHtml(item.shelf.nazev)}
                            </h4>
                            <span class="text-sm text-gray-300 bg-gray-600 px-3 py-1 rounded">
                                ${item.shelf.radky}×${item.shelf.sloupce} pozic
                            </span>
                        </div>
                        <div class="flex justify-center">
                            <div class="grid gap-2 p-4 bg-gray-800 rounded" 
                                 style="grid-template-columns: repeat(${item.shelf.sloupce}, minmax(45px, 45px)); width: fit-content;">
                                ${this.generateShelfGrid(item.shelf, item.positions)}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Generování mřížky regálu s pozicemi
     */
    generateShelfGrid(shelf, positions) {
        let grid = '';
        
        // Skladové číslování: 1-1 vlevo dole, číslujeme zdola nahoru
        for (let r = shelf.radky; r >= 1; r--) { // Změna: začínáme od nejvyššího řádku
            for (let c = 1; c <= shelf.sloupce; c++) {
                // Najdi pozici na této souřadnici
                const position = positions.find(pos => pos.radek === r && pos.sloupec === c);
                
                // GB informace jsou přímo v pozici
                const gb = position ? position.gitterbox : null;
                
                const cellClass = gb ? 'gb-pozice-aktivni' : 'gb-pozice-volna';
                
                // Stylizované tooltipy - jako čistý text pro title atribut
                const tooltip = gb ? 
                    `GB #${gb.cislo_gb}\n👨‍🔧: ${gb.zodpovedna_osoba}\n📦: ${gb.pocet_polozek || 0}\n📊: ${gb.naplnenost_procenta}%${gb.ma_kriticke_expirace ? '\n⚠ Kritická expirace' : ''}` : 
                    `Pozice ${position ? position.nazev : r+'-'+c}\nVolná pozice\nKlikněte pro nový GB`;
                
                grid += `
                    <div class="position-cell has-tooltip ${cellClass} h-12 flex flex-col justify-center items-center cursor-pointer hover:scale-105 transition-transform" 
                         data-custom-tooltip="${escapeHtml(tooltip)}"
                         onclick="regalyTab.showPositionDetail(${position?.id || 'null'}, ${gb?.cislo_gb || 'null'})">
                        <div class="text-xs font-bold">${gb ? gb.cislo_gb : '•'}</div>
                        <div class="text-xs text-gray-400">${gb ? gb.naplnenost_procenta + '%' : r+'-'+c}</div>
                    </div>
                `;
            }
        }
        
        return grid;
    }

    /**
     * Výběr konkrétního regálu z přehledu
     */
    selectShelf(shelfId) {
        this.shelfSelector.value = shelfId;
        this.onShelfChange(shelfId);
    }

    /**
     * Refresh všech dat
     */
    async refresh() {
        // Vymaž cache
        this.allShelvesData = null;
        
        await this.loadInitialData();
        
        // Pokud máme vybraný regál, obnovíme i pozice
        if (this.shelfSelector.value && this.shelfSelector.value !== 'all') {
            await this.loadShelfPositions(this.shelfSelector.value);
            this.renderSpecificShelf();
        } else {
            await this.renderAllShelves();
        }
    }
}

// Globální instance pro přístup z jiných částí
let regalyTab;

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', () => {
    regalyTab = new RegalyTab();
    
    // Export do window pro debugování
    window.regalyTab = regalyTab;
    window.regalyManager = regalyTab;
    
    // Registrace refresh callbacku do hlavní aplikace
    if (window.app) {
        window.app.registerRefreshCallback('regaly', () => regalyTab.refresh());
    } else {
        // Pokud app ještě není inicializovaná, počkáme
        document.addEventListener('app-ready', () => {
            window.app.registerRefreshCallback('regaly', () => regalyTab.refresh());
        });
    }
});
