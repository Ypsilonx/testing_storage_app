# Plán vývoje - Skladová aplikace pro Gitterbox management

## ✅ HOTOVO - Fáze 1: Základní infrastruktura
- ✅ FastAPI backend setup
- ✅ SQLAlchemy ORM konfigurace  
- ✅ SQLite databáze s 5 tabulkami
- ✅ Inicializace dat (3 lokace, 5 regálů, 115 pozic)
- ✅ Globální číslování GB 1-115

## ✅ HOTOVO - Fáze 2.1: Gitterbox Management API
- ✅ Complete CRUD API pro Gitterboxy
- ✅ Router `/api/gitterboxes/` se všemi endpointy
- ✅ Automatické přidělování pozic při vytváření GB
- ✅ Správná response struktura s status/data/message
- ✅ Validace a error handling

## ✅ HOTOVO - Fáze 3.1: Frontend základy
- ✅ HTML struktura s dvěma záložkami (Regály/Vyhledávání)
- ✅ Tailwind CSS styling a responsive design
- ✅ JavaScript modulární architektura (api.js, regaly.js, vyhledavani.js, app.js)
- ✅ Tab switching funkcionalita
- ✅ API komunikace a error handling
- ✅ **FIX**: Oprava JavaScript chyb s API response strukturou

## 🎯 AKTUÁLNÍ STAV - 27.7.2025
- ✅ Server běží na http://localhost:8000
- ✅ 3 testovací Gitterboxy vytvořeny a funkční
- ✅ JavaScript chyby opraveny (gb.pozice.* → gb.*)
- ✅ Frontend plně funkční bez chyb

---

## 🚀 DALŠÍ KROKY

### Fáze 3.2: Formuláře a validace
- [ ] Formulář pro vytvoření nového GB
- [ ] Formulář pro přidání položky do GB
- [ ] Frontend validace vstupů
- [ ] Modal dialogy pro formuláře

### Fáze 3.3: Pokročilé funkce
- [ ] Drag & Drop pro přesouvání GB
- [ ] Bulk operace (vícenásobný výběr)
- [ ] Advanced search s filtry
- [ ] Keyboard shortcuts

### Fáze 4: Vizualizace a UX
- [ ] Barevné kódování podle stavu GB
- [ ] Vizuální indikátory naplněnosti
- [ ] Šrafování pro obsazenost
- [ ] Tooltips s detaily při hover

### Fáze 5: Items Management
- [ ] CRUD API pro položky
- [ ] Frontend pro správu položek
- [ ] Expirace a notifikace
- [ ] TMA čísla a projekty

### Fáze 6: Export a reporting
- [ ] PDF export regálů
- [ ] Excel export dat
- [ ] Tisková funkcionalita
- [ ] Dashboard s přehledy

### Fáze 7: Optimalizace
- [ ] Performance tuning
- [ ] Caching strategie
- [ ] Error monitoring
- [ ] User testing a UX improvements

---

## 📝 Poznámky
- API používá flat strukturu (gb.lokace, gb.regal) místo nested (gb.pozice.lokace)
- Globální číslování GB: 1-115 napříč všemi pozicemi
- Dvoustupňové workflow: Založení GB → přidávání položek
- České názvy v DB, anglické API endpointy
