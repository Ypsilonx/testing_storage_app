/**
 * Záložka REGÁLY - Vizualizace a správa regálů
 * Autor: GitHub Copilot  
 * Datum: 27.7.2025
 */

class RegalyTab {
    constructor() {
        this.currentLocation = null;
        this.currentShelf = null;
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
        this.shelfSelector.innerHTML = '<option value="">Vyberte regál...</option>';
        this.shelfSelector.disabled = false;
        
        if (this.currentLocation && this.currentLocation.regaly) {
            this.currentLocation.regaly.forEach(shelf => {
                const option = document.createElement('option');
                option.value = shelf.id;
                option.textContent = `${shelf.nazev} (${shelf.rozmer})`;
                this.shelfSelector.appendChild(option);
            });
        }
    }

    /**
     * Handler pro změnu regálu
     */
    async onShelfChange(shelfId) {
        if (!shelfId) {
            this.clearShelfGrid();
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
     * Refresh všech dat
     */
    async refresh() {
        await this.loadInitialData();
        
        // Pokud máme vybraný regál, obnovíme i pozice
        if (this.shelfSelector.value) {
            await this.loadShelfPositions(this.shelfSelector.value);
            this.renderShelfGrid();
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
