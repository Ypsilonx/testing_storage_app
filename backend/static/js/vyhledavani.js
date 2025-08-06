/**
 * Záložka VYHLEDÁVÁNÍ - Fulltext vyhledávání a filtry
 * Autor: GitHub Copilot
 * Datum: 27.7.2025
 */

class VyhledavaniTab {
    constructor() {
        this.searchResults = [];
        this.locations = [];
        this.currentQuery = '';
        this.currentFilters = {};
        this.expandedRows = new Set(); // Sledování rozbalených řádků
        this.itemsCache = new Map(); // Cache pro položky GB (gbId -> items)
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadInitialData();
    }

    /**
     * Inicializace DOM elementů
     */
    initializeElements() {
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.clearSearchBtn = document.getElementById('clear-search-btn');
        this.searchResults = document.getElementById('search-results');
        this.warehouseTree = document.getElementById('warehouse-tree');
        
        // Filtry
        this.filterLocation = document.getElementById('filter-location');
        this.filterStatus = document.getElementById('filter-status');
        this.filterProject = document.getElementById('filter-project');
        this.filterPerson = document.getElementById('filter-person');
        
        // Export tlačítka
        this.exportPdfBtn = document.getElementById('export-pdf-btn');
        this.exportExcelBtn = document.getElementById('export-excel-btn');
    }

    /**
     * Připojení event listenerů
     */
    attachEventListeners() {
        // Vyhledávání
        this.searchBtn.addEventListener('click', () => {
            this.performSearch();
        });

        this.clearSearchBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // Enter v search inputu
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Filtry - debounced change handlers
        const debouncedSearch = debounce(() => this.performSearch(), 500);
        
        this.filterLocation.addEventListener('change', debouncedSearch);
        this.filterStatus.addEventListener('change', debouncedSearch);
        this.filterProject.addEventListener('change', debouncedSearch);
        this.filterPerson.addEventListener('change', debouncedSearch);

        // Export tlačítka
        this.exportPdfBtn.addEventListener('click', () => {
            this.exportToPdf();
        });

        this.exportExcelBtn.addEventListener('click', () => {
            this.exportToExcel();
        });
    }

    /**
     * Načtení počátečních dat
     */
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadLocations(),
                this.loadWarehouseTree(),
                this.loadProjectsAndPersons()
            ]);
            // Automaticky zobraz všechna data při načtení záložky
            await this.performSearch();
        } catch (error) {
            console.error('Chyba při načítání dat pro vyhledávání:', error);
        }
    }

    /**
     * Načtení lokací pro filtry
     */
    async loadLocations() {
        try {
            const response = await API.getLocations();
            this.locations = response.data;
            this.populateLocationFilter();
        } catch (error) {
            console.error('Chyba při načítání lokací:', error);
        }
    }

    /**
     * Naplnění filtru lokací
     */
    populateLocationFilter() {
        this.filterLocation.innerHTML = '<option value="">Všechny lokace</option>';
        
        this.locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.nazev;
            option.textContent = location.nazev;
            this.filterLocation.appendChild(option);
        });
    }

    /**
     * Načtení projektů a osob pro filtry
     */
    async loadProjectsAndPersons() {
        try {
            // Načteme všechna GB
            const response = await API.getAllGitterboxes();
            const gitterboxes = response.data;
            
            // Získáme všechny položky pro projekty a naplníme cache
            const allItems = [];
            for (const gb of gitterboxes) {
                try {
                    const itemsResponse = await API.getGitterboxItems(gb.id);
                    const items = itemsResponse.data.polozky;
                    this.itemsCache.set(gb.id, items); // Uložíme do cache
                    allItems.push(...items);
                } catch (error) {
                    console.warn(`Chyba při načítání položek pro GB ${gb.id}:`, error);
                    this.itemsCache.set(gb.id, []); // Prázdný array při chybě
                }
            }
            
            // Extrakce unikátních projektů
            const projects = [...new Set(
                allItems
                    .map(item => item.projekt)
                    .filter(projekt => projekt && projekt.trim() !== '')
            )].sort();
            
            // Extrakce unikátních osob
            const persons = [...new Set(
                gitterboxes
                    .map(gb => gb.zodpovedna_osoba)
                    .filter(osoba => osoba && osoba.trim() !== '')
            )].sort();
            
            this.populateProjectFilter(projects);
            this.populatePersonFilter(persons);
            
        } catch (error) {
            console.error('Chyba při načítání projektů a osob:', error);
        }
    }

    /**
     * Naplnění filtru projektů
     */
    populateProjectFilter(projects) {
        this.filterProject.innerHTML = '<option value="">Všechny projekty</option>';
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
            this.filterProject.appendChild(option);
        });
    }

    /**
     * Naplnění filtru osob
     */
    populatePersonFilter(persons) {
        this.filterPerson.innerHTML = '<option value="">Všechny osoby</option>';
        
        persons.forEach(person => {
            const option = document.createElement('option');
            option.value = person;
            option.textContent = person;
            this.filterPerson.appendChild(option);
        });
    }

    /**
     * Načtení stromové struktury skladu
     */
    async loadWarehouseTree() {
        try {
            const response = await API.getLocations();
            this.renderWarehouseTree(response.data);
        } catch (error) {
            this.warehouseTree.innerHTML = '<div class="text-red-500 text-sm">Chyba při načítání</div>';
        }
    }

    /**
     * Vykreslení stromové struktury
     */
    renderWarehouseTree(locations) {
        this.warehouseTree.innerHTML = locations.map(location => `
            <div class="tree-node root">
                <div class="tree-toggle" data-type="location" data-id="${location.id}">
                    <i class="fas fa-map-marker-alt text-blue-500 mr-1"></i>
                    <span class="font-medium">${location.nazev}</span>
                </div>
                <div class="tree-children">
                    ${location.regaly.map(regal => `
                        <div class="tree-node">
                            <div class="tree-toggle" data-type="shelf" data-id="${regal.id}">
                                <i class="fas fa-th-large text-green-500 mr-1"></i>
                                <span>${regal.nazev}</span>
                                <span class="text-xs text-gray-500 ml-1">(${regal.rozmer})</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Připojení click handlerů na stromové uzly
        this.warehouseTree.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                const id = e.currentTarget.dataset.id;
                this.onTreeNodeClick(type, id);
            });
        });
    }

    /**
     * Handler pro klik na uzel stromu
     */
    onTreeNodeClick(type, id) {
        if (type === 'location') {
            // Filtrace podle lokace
            const location = this.locations.find(loc => loc.id == id);
            if (location) {
                this.filterLocation.value = location.nazev;
                this.performSearch();
            }
        } else if (type === 'shelf') {
            // Přepnutí na regály tab a zobrazení konkrétního regálu
            this.switchToShelfView(id);
        }
    }

    /**
     * Provedení vyhledávání
     */
    async performSearch() {
        try {
            showLoading();
            
            this.currentQuery = this.searchInput.value.trim();
            this.currentFilters = {
                location: this.filterLocation.value,
                status: this.filterStatus.value,
                project: this.filterProject.value,
                person: this.filterPerson.value.trim()
            };

            // Pro teď simulace API volání - použijeme data z regálů
            const allGb = await this.getAllGitterboxesForSearch();
            const filtered = this.filterResults(allGb);
            
            this.displaySearchResults(filtered);
            
        } catch (error) {
            showError('Chyba při vyhledávání: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    /**
     * Získání všech GB pro vyhledávání (simulace fulltext API)
     */
    async getAllGitterboxesForSearch() {
        const response = await API.getAllGitterboxes();
        const gitterboxes = response.data;
        
        // Aktualizuj počet položek v hlavičce pomocí dashboard endpointu (efektivnější)
        try {
            const dashboardResponse = await API.getDashboardStats();
            const statsElement = document.getElementById('stats-total-items');
            if (statsElement && dashboardResponse.data) {
                statsElement.textContent = dashboardResponse.data.celkem_polozek;
            }
        } catch (error) {
            console.warn('Chyba při načítání dashboard statistik:', error);
            // Fallback - sečti z načtených GB
            const celkemPolozek = gitterboxes.reduce((suma, gb) => suma + (gb.pocet_polozek || 0), 0);
            const statsElement = document.getElementById('stats-total-items');
            if (statsElement) {
                statsElement.textContent = celkemPolozek;
            }
        }
        
        return gitterboxes;
    }

    /**
     * Filtrování výsledků podle kritérií
     */
    filterResults(gitterboxes) {
        let results = [...gitterboxes];

        // Textové vyhledávání
        if (this.currentQuery) {
            const query = this.currentQuery.toLowerCase();
            results = results.filter(gb => {
                return (
                    gb.cislo_gb.toString().includes(query) ||
                    gb.zodpovedna_osoba.toLowerCase().includes(query) ||
                    (gb.poznamka && gb.poznamka.toLowerCase().includes(query)) ||
                    gb.lokace.toLowerCase().includes(query) ||
                    gb.regal.toLowerCase().includes(query)
                );
            });
        }

        // Filtr podle lokace
        if (this.currentFilters.location) {
            results = results.filter(gb => gb.lokace === this.currentFilters.location);
        }

        // Filtr podle stavu
        if (this.currentFilters.status) {
            if (this.currentFilters.status === 'kriticka') {
                results = results.filter(gb => gb.ma_kriticke_expirace);
            } else {
                results = results.filter(gb => gb.stav === this.currentFilters.status);
            }
        }

        // Filtr podle zodpovědné osoby
        if (this.currentFilters.person) {
            results = results.filter(gb => gb.zodpovedna_osoba === this.currentFilters.person);
        }

        // Filtr podle projektu - používáme cache
        if (this.currentFilters.project) {
            results = results.filter(gb => {
                const items = this.itemsCache.get(gb.id) || [];
                return items.some(item => item.projekt === this.currentFilters.project);
            });
        }

        return results;
    }

    /**
     * Zobrazení výsledků vyhledávání
     */
    displaySearchResults(results) {
        // Uložení výsledků pro rozbalování
        this.searchResults = results;
        
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-search text-4xl mb-4 text-gray-300"></i>
                    <p class="text-lg">Žádné výsledky</p>
                    <p class="text-sm">Zkuste změnit vyhledávací kritéria</p>
                </div>
            `;
            return;
        }

        // Vytvoření tabulky výsledků
        const searchResultsContainer = document.getElementById('search-results');
        searchResultsContainer.innerHTML = `
            <div class="mb-4 text-sm text-gray-600">
                Nalezeno <strong>${results.length}</strong> výsledků
            </div>
            <div class="overflow-x-auto">
                <table class="search-results-table">
                    <thead>
                        <tr>
                            <th>GB číslo</th>
                            <th>Zodpovědná osoba</th>
                            <th>Lokace</th>
                            <th>Regál</th>
                            <th>Pozice</th>
                            <th>Stav</th>
                            <th>Naplněnost</th>
                            <th>Položky</th>
                            <th>Akce</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(gb => this.createResultRow(gb)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Vytvoření řádku výsledku
     */
    createResultRow(gb) {
        const statusClass = getGbStatusClass(gb);
        const statusText = this.getStatusText(gb);
        const isExpanded = this.expandedRows.has(gb.id);
        
        return `
            <tr class="cursor-pointer hover:bg-gray-50 gb-row-${gb.id}" onclick="vyhledavaniTab.toggleGbExpansion(${gb.id})">
                <td>
                    <div class="flex items-center">
                        <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'} text-gray-400 mr-2 transition-transform" id="chevron-${gb.id}"></i>
                        <div class="w-3 h-3 rounded-full ${statusClass} mr-2"></div>
                        <strong>#${gb.cislo_gb}</strong>
                    </div>
                </td>
                <td>${escapeHtml(gb.zodpovedna_osoba)}</td>
                <td>${escapeHtml(gb.lokace)}</td>
                <td>${escapeHtml(gb.regal)}</td>
                <td>${gb.radek}-${gb.sloupec}</td>
                <td>
                    <span class="px-2 py-1 text-xs rounded-full ${this.getStatusBadgeClass(gb)}">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <div class="flex items-center">
                        <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div class="bg-blue-500 h-2 rounded-full" style="width: ${gb.naplnenost_procenta}%"></div>
                        </div>
                        <span class="text-sm">${gb.naplnenost_procenta}%</span>
                    </div>
                </td>
                <td class="text-center">${gb.pocet_polozek}</td>
                <td>
                    <div class="flex space-x-2">
                        <button 
                            onclick="event.stopPropagation(); vyhledavaniTab.editGitterbox(${gb.id})"
                            class="text-blue-600 hover:text-blue-800 text-sm"
                            title="Editovat Gitterbox"
                        >
                            <i class="fas fa-edit"></i>
                        </button>
                        <button 
                            onclick="event.stopPropagation(); vyhledavaniTab.archiveGitterbox(${gb.id}, '${gb.cislo_gb}')"
                            class="text-red-600 hover:text-red-800 text-sm"
                            title="Vyskladnit celý Gitterbox"
                        >
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                </td>
            </tr>
            ${isExpanded ? this.createExpandedRow(gb) : ''}
        `;
    }

    /**
     * Získání textového popisu stavu
     */
    getStatusText(gb) {
        if (gb.ma_kriticke_expirace) {
            return 'Kritická expirace';
        }
        
        switch (gb.stav) {
            case 'aktivni': return 'Aktivní';
            case 'plny': return 'Plný';
            default: return gb.stav;
        }
    }

    /**
     * CSS třída pro status badge
     */
    getStatusBadgeClass(gb) {
        if (gb.ma_kriticke_expirace) {
            return 'bg-red-100 text-red-800';
        }
        
        switch (gb.stav) {
            case 'aktivni': return 'bg-blue-100 text-blue-800';
            case 'plny': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    /**
     * Vytvoření rozbalené části řádku s položkami
     */
    createExpandedRow(gb) {
        return `
            <tr id="expanded-${gb.id}" class="expanded-row">
                <td colspan="9" class="bg-gray-50 px-4 py-3">
                    <div class="text-sm">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-medium text-gray-900">
                                <i class="fas fa-boxes text-purple-500 mr-2"></i>
                                Položky v GB #${gb.cislo_gb}
                            </h4>
                            <button 
                                onclick="vyhledavaniTab.addItemToGb(${gb.id})"
                                class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded transition-colors"
                                title="Přidat položku"
                            >
                                <i class="fas fa-plus mr-1"></i>
                                Přidat položku
                            </button>
                        </div>
                        <div id="gb-items-${gb.id}" class="space-y-2">
                            <div class="text-gray-500 italic">Načítám položky...</div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Rozbalení/sbalení řádku GB
     */
    async toggleGbExpansion(gbId) {
        const isExpanded = this.expandedRows.has(gbId);
        
        if (isExpanded) {
            // Sbalit
            this.expandedRows.delete(gbId);
            const expandedRow = document.getElementById(`expanded-${gbId}`);
            if (expandedRow) {
                expandedRow.remove();
            }
            // Změnit ikonu
            const chevron = document.getElementById(`chevron-${gbId}`);
            if (chevron) {
                chevron.className = chevron.className.replace('fa-chevron-down', 'fa-chevron-right');
            }
        } else {
            // Rozbalit
            this.expandedRows.add(gbId);
            const gbRow = document.querySelector(`.gb-row-${gbId}`);
            if (gbRow) {
                const gb = this.searchResults.find(g => g.id === gbId);
                if (gb) {
                    gbRow.insertAdjacentHTML('afterend', this.createExpandedRow(gb));
                    // Načíst položky
                    await this.loadGbItems(gbId);
                }
            }
            // Změnit ikonu
            const chevron = document.getElementById(`chevron-${gbId}`);
            if (chevron) {
                chevron.className = chevron.className.replace('fa-chevron-right', 'fa-chevron-down');
            }
        }
    }

    /**
     * Načtení položek pro GB
     */
    async loadGbItems(gbId) {
        try {
            const itemsContainer = document.getElementById(`gb-items-${gbId}`);
            
            if (!itemsContainer) return;
            
            // Zkusíme najít v cache
            let items = this.itemsCache.get(gbId);
            
            // Pokud není v cache, načteme z API
            if (!items) {
                const itemsResponse = await API.getGitterboxItems(gbId);
                items = itemsResponse.data.polozky;
                this.itemsCache.set(gbId, items); // Uložíme do cache
            }
            
            if (items.length === 0) {
                itemsContainer.innerHTML = '<div class="text-gray-500 italic">Žádné položky</div>';
                return;
            }
            
            itemsContainer.innerHTML = items.map(item => `
                <div class="flex items-center justify-between p-2 bg-white rounded border">
                    <div class="flex-1">
                        <div class="font-medium">${escapeHtml(item.nazev_dilu)}</div>
                        <div class="text-xs text-gray-600">
                            ${item.tma_cislo ? `TMA: ${escapeHtml(item.tma_cislo)} • ` : ''}
                            ${item.projekt ? `Projekt: ${escapeHtml(item.projekt)} • ` : ''}
                            Množství: ${escapeHtml(item.popis_mnozstvi)}
                            ${item.expiracni_datum ? ` • Expira: ${formatDate(item.expiracni_datum)}` : ''}
                        </div>
                    </div>
                    <div class="flex space-x-1">
                        <button 
                            onclick="vyhledavaniTab.editItem(${item.id})"
                            class="text-blue-600 hover:text-blue-800 text-xs p-1"
                            title="Editovat položku"
                        >
                            <i class="fas fa-edit"></i>
                        </button>
                        <button 
                            onclick="vyhledavaniTab.archiveItem(${item.id}, '${escapeHtml(item.nazev_dilu)}')"
                            class="text-red-600 hover:text-red-800 text-xs p-1"
                            title="Vyskladnit položku"
                        >
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Chyba při načítání položek:', error);
            const itemsContainer = document.getElementById(`gb-items-${gbId}`);
            if (itemsContainer) {
                itemsContainer.innerHTML = '<div class="text-red-500 text-sm">Chyba při načítání položek</div>';
            }
        }
    }

    /**
     * Editace Gitterboxu
     */
    async editGitterbox(gbId) {
        if (window.gitterboxModal) {
            try {
                // Nejdřív načteme data GB
                const response = await API.getGitterbox(gbId);
                if (response.status === 'success') {
                    window.gitterboxModal.openEdit(response.data);
                } else {
                    alert('Chyba při načítání dat GB: ' + response.message);
                }
            } catch (error) {
                console.error('Chyba při načítání GB pro editaci:', error);
                alert('Chyba při načítání dat GB: ' + error.message);
            }
        } else {
            alert(`Editace GB bude implementována v další fázi (GB ID: ${gbId})`);
        }
    }

    /**
     * Přidání položky do GB
     */
    addItemToGb(gbId) {
        if (window.itemModal) {
            // Pro openCreate potřebujeme GB číslo, ne ID
            const gb = this.searchResults.find(g => g.id === gbId);
            if (gb) {
                window.itemModal.openCreate(gbId, gb.cislo_gb);
            } else {
                alert('Nepodařilo se najít data GB');
            }
        } else {
            alert(`Přidání položky bude implementováno v další fázi (GB ID: ${gbId})`);
        }
    }

    /**
     * Editace položky
     */
    async editItem(itemId) {
        if (window.itemModal) {
            try {
                // Nejdřív načteme data položky
                const response = await API.getItem(itemId);
                if (response.status === 'success') {
                    window.itemModal.openEdit(response.data);
                } else {
                    alert('Chyba při načítání dat položky: ' + response.message);
                }
            } catch (error) {
                console.error('Chyba při načítání položky pro editaci:', error);
                alert('Chyba při načítání dat položky: ' + error.message);
            }
        } else {
            alert(`Editace položky bude implementována v další fázi (Item ID: ${itemId})`);
        }
    }

    /**
     * Archivace/vyskladnění položky
     */
    archiveItem(itemId, itemName) {
        if (window.archiveModal) {
            window.archiveModal.openForItem(itemId, itemName);
            // Cache se invaliduje automaticky při refresh v archiveModal
        } else {
            const confirmed = confirm(`Opravdu chcete vyskladnit položku "${itemName}"?`);
            if (confirmed) {
                console.log('Archivace položky:', itemId);
                alert('Archivace položky bude implementována v další fázi');
            }
        }
    }

    /**
     * Zobrazení detailu GB
     */
    async showGbDetail(gbId) {
        try {
            showLoading();
            const itemsResponse = await API.getGitterboxItems(gbId);
            const gbData = itemsResponse.data;
            
            // Pro teď alert, později modal
            let message = `
GB #${gbData.gitterbox.cislo_gb}
Zodpovědná osoba: ${gbData.gitterbox.zodpovedna_osoba}
Pozice: ${gbData.gitterbox.pozice}
Naplněnost: ${gbData.gitterbox.naplnenost_procenta}%

Položky (${gbData.polozky.length}):
${gbData.polozky.map(item => {
    let line = `• ${item.nazev_dilu}`;
    if (item.tma_cislo) line += ` (TMA: ${item.tma_cislo})`;
    if (item.projekt) line += ` [${item.projekt}]`;
    line += ` - ${item.popis_mnozstvi}`;
    if (item.expiracni_datum) line += ` - exp: ${formatDate(item.expiracni_datum)}`;
    return line;
}).join('\n')}
            `;
            
            alert(message.trim());
            
        } catch (error) {
            showError('Chyba při načítání detailu: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    /**
     * Vymazání vyhledávání
     */
    async clearSearch() {
        this.searchInput.value = '';
        this.filterLocation.value = '';
        this.filterStatus.value = '';
        this.filterProject.value = '';
        this.filterPerson.value = '';
        
        this.currentQuery = '';
        this.currentFilters = {};
        this.expandedRows.clear(); // Sbalit všechny řádky
        
        // Znovu načíst všechna data
        await this.performSearch();
    }

    /**
     * Přepnutí na zobrazení konkrétního regálu v regály tabu
     */
    switchToShelfView(shelfId) {
        try {
            console.log('🔄 Přepínám na regál ID:', shelfId);
            
            // Přepnutí na regály tab
            const regalyTabBtn = document.getElementById('tab-regaly');
            if (!regalyTabBtn) {
                console.error('❌ Tab regály nebyl nalezen');
                return;
            }
            
            regalyTabBtn.click();
            
            // Čekáme na inicializaci regalyTab s postupně se zvyšujícím čekáním
            const attemptSwitch = (attempt = 0) => {
                const maxAttempts = 10;
                const waitTime = 100 + (attempt * 50); // 100ms, 150ms, 200ms, atd.
                
                setTimeout(() => {
                    try {
                        // Kontrola existence regalyTab
                        if (!window.regalyTab) {
                            if (attempt < maxAttempts) {
                                console.log(`⏳ Pokus ${attempt + 1}/${maxAttempts}: regalyTab ještě není k dispozici, čekám...`);
                                attemptSwitch(attempt + 1);
                                return;
                            } else {
                                console.error('❌ window.regalyTab není k dispozici ani po', maxAttempts, 'pokusech');
                                return;
                            }
                        }
                        
                        // RegalyTab používá jen shelfSelector, ne locationSelector!
                        if (!window.regalyTab.shelfSelector) {
                            if (attempt < maxAttempts) {
                                console.log(`⏳ Pokus ${attempt + 1}/${maxAttempts}: shelfSelector ještě není k dispozici, čekám...`);
                                attemptSwitch(attempt + 1);
                                return;
                            } else {
                                console.error('❌ regalyTab.shelfSelector není k dispozici ani po', maxAttempts, 'pokusech');
                                return;
                            }
                        }
                        
                        // Najdeme lokaci pro tento regál
                        let foundLocation = null;
                        let foundShelf = null;
                        
                        for (const location of this.locations) {
                            const shelf = location.regaly.find(r => r.id == shelfId);
                            if (shelf) {
                                foundLocation = location;
                                foundShelf = shelf;
                                break;
                            }
                        }
                        
                        if (!foundLocation || !foundShelf) {
                            console.error('❌ Lokace nebo regál nebyl nalezen pro ID:', shelfId);
                            return;
                        }
                        
                        console.log('✅ Nalezen regál:', foundShelf.nazev, 'v lokaci:', foundLocation.nazev);
                        
                        // RegalyTab má novou architekturu - přímo nastavíme regál (obsahuje všechny regály)
                        window.regalyTab.shelfSelector.value = shelfId;
                        
                        // Zavoláme metodu pro změnu regálu
                        if (typeof window.regalyTab.onShelfChange === 'function') {
                            window.regalyTab.onShelfChange(shelfId);
                            console.log('🎯 Úspěšně přepnuto na regál:', foundShelf.nazev);
                        } else {
                            console.error('❌ regalyTab.onShelfChange není funkce');
                        }
                        
                    } catch (error) {
                        console.error('❌ Chyba při přepínání na regál (pokus', attempt + 1, '):', error);
                        
                        if (attempt < maxAttempts) {
                            attemptSwitch(attempt + 1);
                        }
                    }
                }, waitTime);
            };
            
            // Spustit první pokus
            attemptSwitch(0);
            
        } catch (error) {
            console.error('❌ Chyba v switchToShelfView:', error);
        }
    }

    /**
     * Export do PDF
     */
    async exportToPdf() {
        try {
            showLoading();
            
            // Získej aktuální filtry
            const filters = this.getCurrentFilters();
            
            // Získej download URL
            const downloadUrl = await API.exportSearchToPdf(filters);
            
            // Vytvoř dočasný link pro download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.target = '_blank';
            link.click();
            
            showSuccess('PDF export byl spuštěn');
            
        } catch (error) {
            console.error('Chyba při exportu do PDF:', error);
            showError('Chyba při exportu do PDF: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    /**
     * Export do Excel
     */
    async exportToExcel() {
        try {
            showLoading();
            
            // Získej aktuální filtry
            const filters = this.getCurrentFilters();
            
            // Získej download URL
            const downloadUrl = await API.exportSearchToExcel(filters);
            
            // Vytvoř dočasný link pro download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.target = '_blank';
            link.click();
            
            showSuccess('Excel export byl spuštěn');
            
        } catch (error) {
            console.error('Chyba při exportu do Excel:', error);
            showError('Chyba při exportu do Excel: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    /**
     * Získání aktuálních filtrů pro export
     */
    getCurrentFilters() {
        return {
            query: this.searchInput.value.trim() || null,
            location_id: this.filterLocation.value || null,
            project: this.filterProject.value || null,
            person: this.filterPerson.value || null,
            status: this.filterStatus.value || null
        };
    }

    /**
     * Refresh dat
     */
    async refresh() {
        const wasExpanded = new Set(this.expandedRows); // Zapamatuj rozbalené řádky
        this.expandedRows.clear();
        this.itemsCache.clear(); // Invaliduj cache při refresh
        
        await this.loadInitialData();
        
        // Pokud jsou stále stejné filtry, obnov rozbalené řádky
        if (this.currentQuery || Object.values(this.currentFilters).some(v => v)) {
            setTimeout(() => {
                wasExpanded.forEach(gbId => {
                    const gbRow = document.querySelector(`.gb-row-${gbId}`);
                    if (gbRow) {
                        this.toggleGbExpansion(gbId);
                    }
                });
            }, 100);
        }
    }

    /**
     * Archivace/vyskladnění Gitterboxu
     */
    archiveGitterbox(gbId, gbNumber) {
        if (window.archiveModal) {
            window.archiveModal.openForGitterbox(gbId, gbNumber);
        } else {
            console.error('Archive modal není k dispozici');
        }
    }
}

// Globální instance
let vyhledavaniTab;

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', () => {
    vyhledavaniTab = new VyhledavaniTab();
    
    // Export do window pro debugování
    window.vyhledavaniTab = vyhledavaniTab;
    window.vyhledavaniManager = vyhledavaniTab;
    
    // Registrace refresh callbacku do hlavní aplikace
    const registerCallback = () => {
        if (window.app && window.app.registerRefreshCallback) {
            window.app.registerRefreshCallback('vyhledavani', () => vyhledavaniTab.refresh());
            console.log('✅ Vyhledavani callback registrován');
            return true;
        }
        return false;
    };
    
    // Pokusíme se registrovat ihned
    if (!registerCallback()) {
        // Pokud se nepodařilo, zkusíme počkat na app-ready event
        document.addEventListener('app-ready', () => {
            registerCallback();
        });
        
        // Alternativní fallback - zkusíme to znovu za chvíli
        setTimeout(() => {
            if (!registerCallback()) {
                console.warn('⚠️ Nepodařilo se registrovat vyhledavani callback');
            }
        }, 100);
    }
});
