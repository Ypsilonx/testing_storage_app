/**
 * Admin tab pro správu regálů
 * Autor: GitHub Copilot
 * Datum: 27.7.2025
 */

class AdminTab {
    constructor() {
        this.shelves = [];
        this.locations = [];
        this.initializeElements();
        this.attachEventListeners();
        
        // Registrace do app pro refresh
        if (window.app) {
            window.app.registerRefreshCallback('admin', () => this.loadShelves());
        }
    }

    initializeElements() {
        this.shelvesList = document.getElementById('shelves-list');
        this.createShelfBtn = document.getElementById('btn-create-shelf');
    }

    attachEventListeners() {
        if (this.createShelfBtn) {
            this.createShelfBtn.addEventListener('click', () => {
                this.showCreateShelfModal();
            });
        }
    }

    async loadShelves() {
        try {
            // Show loading
            this.shelvesList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-spinner fa-spin text-4xl mb-4 text-gray-300"></i>
                    <p class="text-lg">Načítám regály...</p>
                </div>
            `;

            const response = await API.getAllShelves();
            this.shelves = response.data || [];

            this.renderShelves();
        } catch (error) {
            console.error('Chyba při načítání regálů:', error);
            this.shelvesList.innerHTML = `
                <div class="text-center py-12 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="text-lg">Chyba při načítání regálů</p>
                    <p class="text-sm">${error.message}</p>
                </div>
            `;
        }
    }

    renderShelves() {
        if (this.shelves.length === 0) {
            this.shelvesList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-th-large text-4xl mb-4 text-gray-300"></i>
                    <p class="text-lg">Žádné regály</p>
                    <p class="text-sm">Klikněte na "Nový regál" pro vytvoření prvního regálu</p>
                </div>
            `;
            return;
        }

        const html = `
            <div class="grid gap-4">
                ${this.shelves.map(shelf => this.renderShelfCard(shelf)).join('')}
            </div>
        `;

        this.shelvesList.innerHTML = html;
        this.attachShelfEventListeners();
    }

    renderShelfCard(shelf) {
        const occupancy = shelf.statistics.occupancy_percentage;
        const occupancyColor = occupancy > 80 ? 'text-red-600' : occupancy > 60 ? 'text-yellow-600' : 'text-green-600';
        
        return `
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="text-lg font-semibold text-gray-900">${shelf.nazev}</h3>
                            <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                ${shelf.typ}
                            </span>
                        </div>
                        
                        <div class="text-sm text-gray-600 mb-3">
                            <p><i class="fas fa-map-marker-alt mr-2"></i>${shelf.location?.nazev || 'Neznámá lokace'}</p>
                            <p><i class="fas fa-grid-3x3 mr-2"></i>${shelf.radky} × ${shelf.sloupce} pozic</p>
                        </div>

                        <div class="flex items-center space-x-4 text-sm">
                            <div class="flex items-center space-x-1">
                                <span class="w-2 h-2 rounded-full bg-gray-300"></span>
                                <span>Celkem: ${shelf.statistics.total_positions}</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                                <span>Obsazeno: ${shelf.statistics.occupied_positions}</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                                <span>Volné: ${shelf.statistics.total_positions - shelf.statistics.occupied_positions}</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <span class="text-${occupancyColor} font-medium">${occupancy}%</span>
                                <span>využití</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex space-x-2 ml-4">
                        <button 
                            class="edit-shelf-btn p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            data-shelf-id="${shelf.id}"
                            title="Upravit regál"
                        >
                            <i class="fas fa-edit"></i>
                        </button>
                        <button 
                            class="delete-shelf-btn p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            data-shelf-id="${shelf.id}"
                            title="Smazat regál"
                            ${shelf.statistics.occupied_positions > 0 ? 'disabled' : ''}
                        >
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachShelfEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-shelf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shelfId = parseInt(e.target.closest('button').dataset.shelfId);
                this.showEditShelfModal(shelfId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-shelf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shelfId = parseInt(e.target.closest('button').dataset.shelfId);
                this.showDeleteConfirmation(shelfId);
            });
        });
    }

    async showCreateShelfModal() {
        if (!window.modalManager) {
            showError('Modal systém není dostupný. Obnovte stránku.');
            return;
        }
        
        try {
            // Load locations if not loaded
            if (this.locations.length === 0) {
                const response = await API.getLocations();
                this.locations = response.data || [];
            }

            const locationOptions = this.locations.map(loc => 
                `<option value="${loc.id}">${loc.nazev}</option>`
            ).join('');

            const modalContent = `
                <form id="create-shelf-form">
                    <div class="grid gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Lokace
                            </label>
                            <select name="location_id" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Vyberte lokaci...</option>
                                ${locationOptions}
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Název regálu
                            </label>
                            <input 
                                type="text" 
                                name="nazev" 
                                required 
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="např. Regál A1"
                            >
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Počet řádků
                                </label>
                                <input 
                                    type="number" 
                                    name="radky" 
                                    required 
                                    min="1" 
                                    max="20"
                                    value="4"
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Počet sloupců
                                </label>
                                <input 
                                    type="number" 
                                    name="sloupce" 
                                    required 
                                    min="1" 
                                    max="20"
                                    value="6"
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Typ regálu
                            </label>
                            <select name="typ" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="standardni">Standardní</option>
                                <option value="velky">Velký</option>
                                <option value="maly">Malý</option>
                                <option value="specialni">Speciální</option>
                            </select>
                        </div>
                    </div>
                </form>
            `;

            window.modalManager.show({
                title: '📦 Nový regál',
                content: modalContent,
                size: 'medium',
                buttons: [
                    {
                        text: 'Zrušit',
                        variant: 'secondary',
                        action: () => window.modalManager.hide()
                    },
                    {
                        text: 'Vytvořit regál',
                        variant: 'primary',
                        action: () => this.handleCreateShelf()
                    }
                ]
            });

        } catch (error) {
            console.error('Chyba při načítání lokací:', error);
            showError('Chyba při načítání lokací: ' + error.message);
        }
    }

    async handleCreateShelf() {
        try {
            const form = document.getElementById('create-shelf-form');
            const formData = new FormData(form);
            
            const shelfData = {
                location_id: parseInt(formData.get('location_id')),
                nazev: formData.get('nazev'),
                radky: parseInt(formData.get('radky')),
                sloupce: parseInt(formData.get('sloupce')),
                typ: formData.get('typ')
            };

            await API.createShelf(shelfData);
            
            window.modalManager.hide();
            showSuccess('Regál byl úspěšně vytvořen');
            await this.loadShelves();

        } catch (error) {
            console.error('Chyba při vytváření regálu:', error);
            showError('Chyba při vytváření regálu: ' + error.message);
        }
    }

    async showEditShelfModal(shelfId) {
        console.log('=== DEBUG showEditShelfModal ===');
        console.log('window.modalManager:', window.modalManager);
        console.log('typeof window.modalManager:', typeof window.modalManager);
        if (window.modalManager) {
            console.log('modalManager methods:', Object.getOwnPropertyNames(window.modalManager));
            console.log('modalManager.show:', window.modalManager.show);
            console.log('typeof modalManager.show:', typeof window.modalManager.show);
        }
        
        if (!window.modalManager) {
            showError('Modal systém není dostupný. Obnovte stránku.');
            return;
        }
        
        if (typeof window.modalManager.show !== 'function') {
            showError('Modal systém nemá metodu show(). Obnovte stránku.');
            return;
        }
        
        try {
            const shelf = this.shelves.find(s => s.id === shelfId);
            if (!shelf) {
                showError('Regál nebyl nalezen');
                return;
            }

            // Load locations if not loaded
            if (this.locations.length === 0) {
                const response = await API.getLocations();
                this.locations = response.data || [];
            }

            const locationOptions = this.locations.map(loc => 
                `<option value="${loc.id}" ${loc.id === shelf.location?.id ? 'selected' : ''}>${loc.nazev}</option>`
            ).join('');

            const hasOccupiedPositions = shelf.statistics.occupied_positions > 0;

            const modalContent = `
                <form id="edit-shelf-form">
                    <div class="grid gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Název regálu
                            </label>
                            <input 
                                type="text" 
                                name="nazev" 
                                value="${shelf.nazev}"
                                required 
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Počet řádků
                                </label>
                                <input 
                                    type="number" 
                                    name="radky" 
                                    value="${shelf.radky}"
                                    min="1" 
                                    max="20"
                                    ${hasOccupiedPositions ? 'disabled' : ''}
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${hasOccupiedPositions ? 'bg-gray-100' : ''}"
                                >
                                ${hasOccupiedPositions ? '<p class="text-xs text-red-600 mt-1">Nelze měnit velikost regálu s obsazenými pozicemi</p>' : ''}
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Počet sloupců
                                </label>
                                <input 
                                    type="number" 
                                    name="sloupce" 
                                    value="${shelf.sloupce}"
                                    min="1" 
                                    max="20"
                                    ${hasOccupiedPositions ? 'disabled' : ''}
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${hasOccupiedPositions ? 'bg-gray-100' : ''}"
                                >
                                ${hasOccupiedPositions ? '<p class="text-xs text-red-600 mt-1">Nelze měnit velikost regálu s obsazenými pozicemi</p>' : ''}
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Typ regálu
                            </label>
                            <select name="typ" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="standardni" ${shelf.typ === 'standardni' ? 'selected' : ''}>Standardní</option>
                                <option value="velky" ${shelf.typ === 'velky' ? 'selected' : ''}>Velký</option>
                                <option value="maly" ${shelf.typ === 'maly' ? 'selected' : ''}>Malý</option>
                                <option value="specialni" ${shelf.typ === 'specialni' ? 'selected' : ''}>Speciální</option>
                            </select>
                        </div>

                        ${hasOccupiedPositions ? `
                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div class="flex items-start">
                                    <i class="fas fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
                                    <div class="text-sm">
                                        <p class="font-medium text-yellow-800">Regál obsahuje obsazené pozice</p>
                                        <p class="text-yellow-700">Změna velikosti není možná dokud nepřemístíte nebo nearchivujete všechny Gitterboxy (${shelf.statistics.occupied_positions} pozic).</p>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </form>
            `;

            window.modalManager.show({
                title: `⚙️ Úprava regálu: ${shelf.nazev}`,
                content: modalContent,
                size: 'medium',
                buttons: [
                    {
                        text: 'Zrušit',
                        variant: 'secondary',
                        action: () => window.modalManager.hide()
                    },
                    {
                        text: 'Uložit změny',
                        variant: 'primary',
                        action: () => this.handleUpdateShelf(shelfId)
                    }
                ]
            });

        } catch (error) {
            console.error('Chyba při načítání detailu regálu:', error);
            showError('Chyba při načítání detailu regálu: ' + error.message);
        }
    }

    async handleUpdateShelf(shelfId) {
        try {
            const form = document.getElementById('edit-shelf-form');
            const formData = new FormData(form);
            
            const updates = {};
            
            // Only include non-empty values
            const nazev = formData.get('nazev');
            if (nazev) updates.nazev = nazev;
            
            const radky = formData.get('radky');
            if (radky && !form.querySelector('[name="radky"]').disabled) {
                updates.radky = parseInt(radky);
            }
            
            const sloupce = formData.get('sloupce');
            if (sloupce && !form.querySelector('[name="sloupce"]').disabled) {
                updates.sloupce = parseInt(sloupce);
            }
            
            const typ = formData.get('typ');
            if (typ) updates.typ = typ;

            await API.updateShelf(shelfId, updates);
            
            window.modalManager.hide();
            showSuccess('Regál byl úspěšně aktualizován');
            await this.loadShelves();

        } catch (error) {
            console.error('Chyba při aktualizaci regálu:', error);
            showError('Chyba při aktualizaci regálu: ' + error.message);
        }
    }

    async showDeleteConfirmation(shelfId) {
        if (!window.modalManager) {
            showError('Modal systém není dostupný. Obnovte stránku.');
            return;
        }
        
        const shelf = this.shelves.find(s => s.id === shelfId);
        if (!shelf) {
            showError('Regál nebyl nalezen');
            return;
        }

        if (shelf.statistics.occupied_positions > 0) {
            showError('Nelze smazat regál s obsazenými pozicemi');
            return;
        }

        const modalContent = `
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Smazat regál?</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Opravdu chcete smazat regál <strong>${shelf.nazev}</strong>?
                    Tuto akci nelze vrátit zpět.
                </p>
                <div class="bg-gray-50 rounded-lg p-3 text-left">
                    <div class="text-sm text-gray-600">
                        <p><strong>Regál:</strong> ${shelf.nazev}</p>
                        <p><strong>Lokace:</strong> ${shelf.location?.nazev}</p>
                        <p><strong>Velikost:</strong> ${shelf.radky} × ${shelf.sloupce} pozic</p>
                        <p><strong>Stav:</strong> ${shelf.statistics.total_positions} pozic (všechny volné)</p>
                    </div>
                </div>
            </div>
        `;

        window.modalManager.show({
            title: '⚠️ Potvrzení smazání',
            content: modalContent,
            size: 'small',
            buttons: [
                {
                    text: 'Zrušit',
                    variant: 'secondary',
                    action: () => window.modalManager.hide()
                },
                {
                    text: 'Smazat regál',
                    variant: 'danger',
                    action: () => this.handleDeleteShelf(shelfId)
                }
            ]
        });
    }

    async handleDeleteShelf(shelfId) {
        try {
            await API.deleteShelf(shelfId);
            
            window.modalManager.hide();
            showSuccess('Regál byl úspěšně smazán');
            await this.loadShelves();

        } catch (error) {
            console.error('Chyba při mazání regálu:', error);
            showError('Chyba při mazání regálu: ' + error.message);
        }
    }
}

// Initialize when DOM is ready AND modals are available
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== ADMIN INIT START ===');
    console.log('window.modalManager při DOM ready:', window.modalManager);
    
    // Wait for modal manager to be available
    const initAdmin = () => {
        console.log('=== initAdmin pokus ===');
        console.log('window.modalManager:', window.modalManager);
        console.log('typeof window.modalManager:', typeof window.modalManager);
        
        if (window.modalManager) {
            console.log('✅ Modal manager nalezen');
            console.log('Modal manager metody:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.modalManager)));
            console.log('show method existuje:', typeof window.modalManager.show);
            
            window.adminTab = new AdminTab();
            console.log('✅ Admin tab initialized');
        } else {
            console.log('⏳ Modal manager ještě není dostupný, čekám...');
            setTimeout(initAdmin, 100);
        }
    };
    
    initAdmin();
});
