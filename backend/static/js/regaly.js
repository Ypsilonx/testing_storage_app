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

        // Spočítej celkový počet pozic
        let totalPositions = 0;
        this.locations.forEach(location => {
            if (location.regaly) {
                location.regaly.forEach(shelf => {
                    totalPositions += shelf.radky * shelf.sloupce;
                });
            }
        });

        // Aktualizuj elementy
        if (totalGbEl) {
            totalGbEl.textContent = `${this.gitterboxes.length}/${totalPositions}`;
        }
        
        if (criticalEl) {
            const criticalCount = this.gitterboxes.filter(gb => gb.ma_kriticke_expirace).length;
            criticalEl.textContent = criticalCount;
        }
        
        if (utilizationEl && totalPositions > 0) {
            const utilization = Math.round((this.gitterboxes.length / totalPositions) * 100);
            utilizationEl.textContent = `${utilization}%`;
        }
    }

    /**
     * Zobrazení detailu pozice/GB
     */
    showPositionDetail(poziceId, gbId) {
        if (gbId) {
            // Zobrazit detail GB a přidat do recent
            const gb = this.gitterboxes.find(g => g.id === gbId);
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
     * Vykreslení všech regálů v přehledu - pod sebou s pozicemi
     */
    async renderAllShelves() {
        if (!this.shelfGrid) return;
        
        // Načti pozice pro všechny regály
        let allPositions = [];
        for (const location of this.locations) {
            if (location.regaly) {
                for (const shelf of location.regaly) {
                    try {
                        const response = await API.getShelfPositions(shelf.id);
                        allPositions.push({
                            shelf: shelf,
                            location: location,
                            positions: response.data.pozice || []
                        });
                    } catch (error) {
                        console.warn(`Chyba při načítání pozic pro regál ${shelf.nazev}:`, error);
                    }
                }
            }
        }
        
        this.shelfGrid.innerHTML = `
            <div class="space-y-8">
                ${allPositions.map(item => `
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
                        <div class="grid gap-2 p-4 bg-gray-800 rounded" 
                             style="grid-template-columns: repeat(${item.shelf.sloupce}, minmax(0, 1fr));">
                            ${this.generateShelfGrid(item.shelf, item.positions)}
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
        
        for (let r = 1; r <= shelf.radky; r++) {
            for (let c = 1; c <= shelf.sloupce; c++) {
                // Najdi pozici na této souřadnici
                const position = positions.find(pos => pos.radek === r && pos.sloupec === c);
                // Najdi GB na této pozici
                const gb = this.gitterboxes.find(gb => 
                    gb.regal === shelf.nazev && gb.radek === r && gb.sloupec === c
                );
                
                const cellClass = gb ? 'gb-pozice-aktivni' : 'gb-pozice-volna';
                const gbInfo = gb ? `GB #${gb.cislo_gb}` : 'Volná';
                const tooltip = gb ? 
                    `GB #${gb.cislo_gb}\\n${gb.zodpovedna_osoba}\\n${gb.naplnenost_procenta}% naplněno` : 
                    `Pozice ${r}-${c}\\nVolná pozice`;
                
                grid += `
                    <div class="position-cell ${cellClass}" 
                         title="${tooltip}"
                         onclick="regalyTab.showPositionDetail(${position?.id || 'null'}, ${gb?.id || 'null'})">
                        <div class="text-xs font-bold">${gb ? gb.cislo_gb : '•'}</div>
                        <div class="text-xs text-gray-400">${r}-${c}</div>
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
