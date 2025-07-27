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
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadInitialData();
    }

    /**
     * Inicializace DOM elementů
     */
    initializeElements() {
        this.locationSelector = document.getElementById('location-selector');
        this.shelfSelector = document.getElementById('shelf-selector');
        this.shelfGrid = document.getElementById('shelf-grid');
        this.criticalList = document.getElementById('critical-list');
        this.gbByLocation = document.getElementById('gb-by-location');
        this.newGbBtn = document.getElementById('btn-new-gb');
        this.quickSearchBtn = document.getElementById('btn-quick-search');
    }

    /**
     * Připojení event listenerů
     */
    attachEventListeners() {
        // Selectory
        this.locationSelector.addEventListener('change', (e) => {
            this.onLocationChange(e.target.value);
        });

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
            this.populateLocationSelector();
            this.populateShelfSelector(); // Přidáno pro dropdown regálů
            this.renderAllShelves(); // Zobrazit přehled všech regálů na začátku
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
            this.updateGbByLocation();
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
     * Naplnění selectoru lokací
     */
    populateLocationSelector() {
        this.locationSelector.innerHTML = '<option value="">Vyberte lokaci...</option>';
        
        this.locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = location.nazev;
            this.locationSelector.appendChild(option);
        });
    }

    /**
     * Handler pro změnu lokace
     */
    async onLocationChange(locationId) {
        if (!locationId) {
            this.clearShelfSelector();
            this.clearShelfGrid();
            return;
        }

        this.currentLocation = this.locations.find(loc => loc.id == locationId);
        this.populateShelfSelector();
        this.clearShelfGrid();
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
            this.renderAllShelves();
            return;
        }

        try {
            showLoading();
            await this.loadShelfPositions(shelfId);
            this.renderShelfGrid();
        } catch (error) {
            showError('Chyba při načítání pozic regálu: ' + error.message);
        } finally {
            hideLoading();
        }
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
     * Vykreslení regálové mřížky
     */
    renderShelfGrid() {
        if (!this.currentShelf || !this.positions) {
            this.clearShelfGrid();
            return;
        }

        const { radky, sloupce } = this.currentShelf;
        
        // Vytvoření CSS grid
        this.shelfGrid.style.gridTemplateColumns = `repeat(${sloupce}, 1fr)`;
        this.shelfGrid.style.gridTemplateRows = `repeat(${radky}, 1fr)`;
        this.shelfGrid.className = 'position-grid';
        
        // Vymazání obsahu
        this.shelfGrid.innerHTML = '';

        // Vytvoření pozic
        for (let radek = 1; radek <= radky; radek++) {
            for (let sloupec = 1; sloupec <= sloupce; sloupec++) {
                const pozice = this.positions.find(p => p.radek === radek && p.sloupec === sloupec);
                const cell = this.createPositionCell(pozice, radek, sloupec);
                this.shelfGrid.appendChild(cell);
            }
        }
    }

    /**
     * Vytvoření buňky pozice
     */
    createPositionCell(pozice, radek, sloupec) {
        const cell = document.createElement('div');
        cell.className = 'position-cell';
        
        if (pozice) {
            // Pozice existuje
            const statusClass = getPositionStatusClass(pozice);
            cell.classList.add(statusClass);
            
            if (pozice.gitterbox) {
                // Pozice má GB
                cell.innerHTML = `
                    <div class="text-center">
                        <div class="font-bold">${pozice.gitterbox.cislo_gb}</div>
                        <div class="text-xs">${pozice.gitterbox.naplnenost_procenta}%</div>
                    </div>
                `;
                
                // Šrafování pro neúplně naplněné GB
                if (pozice.gitterbox.naplnenost_procenta < 80) {
                    cell.classList.add('gb-pattern');
                }
                
                // Tooltip
                const tooltip = this.createPositionTooltip(pozice);
                cell.appendChild(tooltip);
                
                // Klik handler
                cell.addEventListener('click', () => {
                    this.showGbDetail(pozice.gitterbox.cislo_gb);
                });
                
            } else {
                // Volná pozice
                cell.innerHTML = `
                    <div class="text-center text-gray-500">
                        <div class="text-xs">${radek}-${sloupec}</div>
                        <div class="text-xs">Volná</div>
                    </div>
                `;
                
                // Klik handler pro vytvoření nového GB
                cell.addEventListener('click', () => {
                    this.showNewGbModal(pozice.id);
                });
            }
            
        } else {
            // Pozice neexistuje (např. díra v regálu)
            cell.classList.add('bg-gray-300', 'border-gray-400');
            cell.innerHTML = '<div class="text-gray-500 text-xs">-</div>';
        }

        return cell;
    }

    /**
     * Vytvoření tooltipu pro pozici
     */
    createPositionTooltip(pozice) {
        const tooltip = document.createElement('div');
        tooltip.className = 'position-tooltip';
        
        if (pozice.gitterbox) {
            const gb = pozice.gitterbox;
            tooltip.innerHTML = `
                <div><strong>GB #${gb.cislo_gb}</strong></div>
                <div>Osoba: ${gb.zodpovedna_osoba}</div>
                <div>Položky: ${gb.pocet_polozek}</div>
                <div>Naplněnost: ${gb.naplnenost_procenta}%</div>
                ${gb.ma_kriticke_expirace ? '<div class="text-red-300">⚠ Kritická expirace</div>' : ''}
            `;
        } else {
            tooltip.innerHTML = `
                <div><strong>Pozice ${pozice.nazev}</strong></div>
                <div>Stav: ${pozice.status}</div>
                <div>Klikněte pro nový GB</div>
            `;
        }
        
        return tooltip;
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
     * Aktualizace seznamu GB podle lokace
     */
    updateGbByLocation() {
        if (this.gitterboxes.length === 0) {
            this.gbByLocation.innerHTML = `
                <div class="text-gray-500 text-sm italic">
                    Žádné aktivní Gitterboxy
                </div>
            `;
            return;
        }

        // Seskupení podle lokace
        const gbByLoc = {};
        this.gitterboxes.forEach(gb => {
            const lokace = gb.lokace;
            if (!gbByLoc[lokace]) {
                gbByLoc[lokace] = [];
            }
            gbByLoc[lokace].push(gb);
        });

        // Vykreslení
        this.gbByLocation.innerHTML = Object.keys(gbByLoc).map(lokace => `
            <div class="mb-3">
                <h4 class="font-medium text-gray-900 mb-2">
                    <i class="fas fa-map-marker-alt mr-1"></i>
                    ${lokace} (${gbByLoc[lokace].length})
                </h4>
                <div class="space-y-1">
                    ${gbByLoc[lokace].slice(0, 5).map(gb => `
                        <div class="flex items-center justify-between text-sm p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" 
                             onclick="regalyTab.showGbDetail(${gb.cislo_gb})">
                            <span>GB #${gb.cislo_gb}</span>
                            <span class="text-xs text-gray-500">${gb.regal}</span>
                        </div>
                    `).join('')}
                    ${gbByLoc[lokace].length > 5 ? `
                        <div class="text-xs text-gray-500 text-center">
                            ... a dalších ${gbByLoc[lokace].length - 5}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Aktualizace statistik v headeru
     */
    updateStatistics(stats) {
        const totalGbEl = document.getElementById('stats-total-gb');
        const criticalEl = document.getElementById('stats-critical');
        const utilizationEl = document.getElementById('stats-utilization');

        if (totalGbEl) totalGbEl.textContent = this.gitterboxes.length;
        if (criticalEl) criticalEl.textContent = this.gitterboxes.filter(gb => gb.ma_kriticke_expirace).length;
        if (utilizationEl && stats.celkem_pozic) {
            const utilization = Math.round((this.gitterboxes.length / stats.celkem_pozic) * 100);
            utilizationEl.textContent = `${utilization}%`;
        }
    }

    /**
     * Zobrazení detailu Gitterboxu
     */
    async showGbDetail(cisloGb) {
        // Pro teď jen alert, později modal
        try {
            showLoading();
            const gb = this.gitterboxes.find(g => g.cislo_gb == cisloGb);
            if (gb) {
                const itemsResponse = await API.getGitterboxItems(gb.id);
                const items = itemsResponse.data.polozky;
                
                let message = `
GB #${gb.cislo_gb}
Zodpovědná osoba: ${gb.zodpovedna_osoba}
Pozice: ${gb.lokace} > ${gb.regal} > ${gb.radek}-${gb.sloupec}
Naplněnost: ${gb.naplnenost_procenta}%
Položky: ${items.length}

Položky:
${items.map(item => `- ${item.nazev_dilu} (${item.popis_mnozstvi})`).join('\n')}
                `;
                
                alert(message.trim());
            }
        } catch (error) {
            showError('Chyba při načítání detailu GB: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    /**
     * Zobrazení modalu pro nový GB
     */
    showNewGbModal(poziceId = null) {
        // Pro teď jednoduchý prompt, později modal
        const osoba = prompt('Zadejte zodpovědnou osobu:');
        if (!osoba) return;

        const poznamka = prompt('Poznámka (volitelné):') || '';

        this.createNewGb({ 
            zodpovedna_osoba: osoba, 
            poznamka: poznamka 
        });
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
            if (this.shelfSelector.value) {
                await this.loadShelfPositions(this.shelfSelector.value);
                this.renderShelfGrid();
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
     * Vykreslení všech regálů v přehledu
     */
    renderAllShelves() {
        if (!this.shelfGrid) return;
        
        this.shelfGrid.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${this.locations.map(location => `
                    <div class="location-container">
                        <h4 class="text-lg font-semibold text-gray-200 mb-4 flex items-center">
                            <i class="fas fa-map-marker-alt text-blue-400 mr-2"></i>
                            ${escapeHtml(location.nazev)}
                        </h4>
                        <div class="space-y-4">
                            ${location.regaly ? location.regaly.map(shelf => `
                                <div class="shelf-overview bg-gray-800 rounded-lg p-4 border border-gray-600">
                                    <div class="flex justify-between items-center mb-3">
                                        <h5 class="font-medium text-gray-200">${escapeHtml(shelf.nazev)}</h5>
                                        <span class="text-sm text-gray-400">${shelf.radky}×${shelf.sloupce} pozic</span>
                                    </div>
                                    <div class="grid gap-1" style="grid-template-columns: repeat(${shelf.sloupce}, minmax(0, 1fr));">
                                        ${this.generateShelfPreview(shelf)}
                                    </div>
                                    <button 
                                        class="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
                                        onclick="regalyTab.selectShelf(${shelf.id})"
                                    >
                                        <i class="fas fa-eye mr-1"></i>
                                        Zobrazit detail
                                    </button>
                                </div>
                            `).join('') : '<div class="text-gray-500 text-sm">Žádné regály</div>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Generování náhledu regálu (mini mřížka)
     */
    generateShelfPreview(shelf) {
        const totalPositions = shelf.radky * shelf.sloupce;
        let preview = '';
        
        for (let r = 1; r <= shelf.radky; r++) {
            for (let c = 1; c <= shelf.sloupce; c++) {
                // Najdi GB na této pozici
                const gb = this.gitterboxes.find(gb => 
                    gb.regal === shelf.nazev && gb.radek === r && gb.sloupec === c
                );
                
                const cellClass = gb ? 'gb-aktivni' : 'gb-volna';
                preview += `
                    <div class="position-cell-mini ${cellClass} text-xs" 
                         title="${gb ? `GB #${gb.cislo_gb}` : 'Volná pozice'}">
                        ${gb ? gb.cislo_gb : '•'}
                    </div>
                `;
            }
        }
        
        return preview;
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
        await this.loadInitialData();
        
        // Pokud máme vybraný regál, obnovíme i pozice
        if (this.shelfSelector.value && this.shelfSelector.value !== 'all') {
            await this.loadShelfPositions(this.shelfSelector.value);
            this.renderShelfGrid();
        } else {
            this.renderAllShelves();
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
});
