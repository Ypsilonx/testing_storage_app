# PLÁN VÝVOJE SKLADOVÉ APLIKACE

## 📋 CELKOVÝ PŘEHLED PROJEKTU

**Název:** Skladová aplikace pro správu Gitterboxů  
**Technologie:** Python FastAPI + SQLite + HTML/CSS/JavaScript  
**Cíl:** Webová aplikace pro správu skladu s vizualizací regálů a sledováním expirací

---

## 📈 AKTUÁLNÍ STAV (27.7.2025)

### ✅ DOKONČENO:
- **Phase 1 kompletní** - Backend základ, databáze, API endpointy
- **Phase 2.1 kompletní** - Gitterbox CRUD API s globálním číslováním
  - `/api/gitterboxes/` - vytvoření, seznam, detail, úprava, smazání
  - Automatické přiřazování pozic 1-115
  - Relace s lokacemi/regály/pozicemi fungují
  - API testováno a funkční

### 🔄 AKTUÁLNĚ:
- Připraveno k implementaci Phase 2.2 (validace a error handling)
- Nebo Phase 2.3 (API pro správu položek v GB)

---

## 🎯 KLÍČOVÉ FUNKCE
- [x] ✅ Plán a architektura definována
- [x] ✅ Globální číslování GB (1 až max pozic celého skladu) - API implementováno
- [ ] 🔄 Dvoustupňové založení: GB → přidávání položek
- [ ] 🔄 Flexibilní sledování expirací (lze vypnout)
- [ ] 🔄 Vizualizace regálů s barevným kódováním
- [ ] 🔄 Naplněnost GB v procentech + šrafování
- [ ] 🔄 Dvě hlavní záložky: REGÁLY + VYHLEDÁVÁNÍ
- [ ] 🔄 Fulltext vyhledávání se stromovou strukturou
- [ ] 🔄 Export do PDF/Excel

---

## 📊 DATOVÝ MODEL

### Tabulky:
1. **locations** - lokace (Mošnov, Kopřivnice)
2. **shelves** - regály s rozměry
3. **positions** - pozice v regálech
4. **gitterboxes** - hlavní kontejnery
5. **items** - položky uvnitř GB (s počty kusů)

### Klíčové vlastnosti:
- Globální číslování GB: 1 až součet všech pozic
- Položky: TMA (volitelné), projekt (volitelný), počet kusů, expirace (volitelná)
- Naplněnost GB: 0-100%, vizuální indikace

---

## 🚀 IMPLEMENTAČNÍ PLÁN

### FÁZE 1: ZÁKLADNÍ BACKEND (týden 1)
- [x] 1.1 Nastavení projektu a závislostí ✅
- [x] 1.2 SQLAlchemy modely databáze ✅
- [x] 1.3 Inicializace databáze s test daty ✅
- [x] 1.4 Základní FastAPI struktura ✅
- [x] 1.5 API endpointy pro lokace a regály ✅

### FÁZE 2: GITTERBOX MANAGEMENT (týden 2)
- [x] 2.1 API pro správu Gitterboxů ✅ (27.7.2025)
- [ ] 2.2 Globální číslování a kontrola dostupnosti
- [ ] 2.3 API pro správu položek
- [ ] 2.4 Logika expirací a naplněnosti
- [ ] 2.5 Testy backend funkcionalit

### FÁZE 3: ZÁKLADNÍ FRONTEND (týden 3)
- [ ] 3.1 HTML struktura se dvěma záložkami
- [ ] 3.2 CSS styling s Tailwind
- [ ] 3.3 JavaScript pro interaktivitu
- [ ] 3.4 Základní formuláře (nový GB, přidání položky)
- [ ] 3.5 Propojení s API

### FÁZE 4: VIZUALIZACE REGÁLŮ (týden 4)
- [ ] 4.1 Generování regálových mřížek
- [ ] 4.2 Barevné kódování pozic
- [ ] 4.3 Interaktivní klikání na pozice
- [ ] 4.4 Tooltip informace
- [ ] 4.5 Šrafování pro neúplně naplněné GB

### FÁZE 5: DETAILNÍ POHLEDY (týden 5)
- [ ] 5.1 Detail GB s položkami
- [ ] 5.2 Editace GB a položek
- [ ] 5.3 Vyskladňování (položka vs celý GB)
- [ ] 5.4 Dashboard s kritickyími expiraci
- [ ] 5.5 Statistiky a přehledy

### FÁZE 6: VYHLEDÁVÁNÍ (týden 6)
- [ ] 6.1 Fulltext vyhledávání
- [ ] 6.2 Stromová struktura skladu
- [ ] 6.3 Zvýraznění výsledků
- [ ] 6.4 Pokročilé filtry
- [ ] 6.5 Propojení mezi záložkami

### FÁZE 7: EXPORT A TISK (týden 7)
- [ ] 7.1 Export do PDF
- [ ] 7.2 Export do Excel
- [ ] 7.3 Tiskové reporty
- [ ] 7.4 Email notifikace expirací
- [ ] 7.5 Konfigurace exportů

### FÁZE 8: FINALIZACE (týden 8)
- [ ] 8.1 Optimalizace výkonu
- [ ] 8.2 Error handling a validace
- [ ] 8.3 Dokumentace uživatele
- [ ] 8.4 Deployment setup
- [ ] 8.5 Testování a bugfixy

---

## 📁 STRUKTURA PROJEKTU

```
testing_storage_app/
├── backend/
│   ├── main.py              # FastAPI aplikace
│   ├── models.py            # SQLAlchemy modely
│   ├── database.py          # DB konfigurace
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── gitterboxes.py   # API pro GB
│   │   ├── items.py         # API pro položky
│   │   ├── positions.py     # API pro pozice/regály
│   │   ├── search.py        # API pro vyhledávání
│   │   └── exports.py       # API pro exporty
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gitterbox_service.py
│   │   ├── numbering_service.py
│   │   └── export_service.py
│   └── static/              # Frontend soubory
│       ├── index.html       # Hlavní HTML
│       ├── css/
│       │   └── style.css    # CSS styly
│       └── js/
│           ├── app.js       # Hlavní JS logika
│           ├── regaly.js    # Záložka regály
│           ├── vyhledavani.js # Záložka vyhledávání
│           └── api.js       # API komunikace
├── tests/                   # Testy
├── docs/                    # Dokumentace
├── requirements.txt         # Python závislosti
├── .env                     # Konfigurace
├── .gitignore
└── README.md
```

---

## 🗃️ DATOVÉ SCHÉMA

### locations
```sql
id INTEGER PRIMARY KEY
nazev VARCHAR(50) NOT NULL
popis TEXT
```

### shelves  
```sql
id INTEGER PRIMARY KEY
location_id INTEGER REFERENCES locations(id)
nazev VARCHAR(50) NOT NULL
radky INTEGER NOT NULL
sloupce INTEGER NOT NULL
typ VARCHAR(20)
```

### positions
```sql
id INTEGER PRIMARY KEY  
shelf_id INTEGER REFERENCES shelves(id)
radek INTEGER NOT NULL
sloupec INTEGER NOT NULL
status VARCHAR(20) DEFAULT 'volna'
```

### gitterboxes
```sql
id INTEGER PRIMARY KEY
cislo_gb INTEGER UNIQUE NOT NULL
position_id INTEGER REFERENCES positions(id)
zodpovedna_osoba VARCHAR(100) NOT NULL
datum_zalozeni DATE DEFAULT CURRENT_DATE
naplnenost_procenta INTEGER DEFAULT 0
stav VARCHAR(20) DEFAULT 'aktivni'
poznamka TEXT
```

### items
```sql
id INTEGER PRIMARY KEY
gitterbox_id INTEGER REFERENCES gitterboxes(id)
tma_cislo VARCHAR(50)
projekt VARCHAR(100)
nazev_dilu VARCHAR(200) NOT NULL
pocet_kusu INTEGER DEFAULT 1
jednotka VARCHAR(10) DEFAULT 'ks'
datum_zaskladneni DATE DEFAULT CURRENT_DATE
sledovat_expiraci BOOLEAN DEFAULT TRUE
expiracni_datum DATE
stav VARCHAR(20) DEFAULT 'aktivni'
poznamka TEXT
```

---

## 🎨 UI KOMPONENTY

### Záložka REGÁLY:
1. **Přehled GB** - seznam s rychlými info
2. **Vizualizace regálu** - interaktivní mřížka
3. **Detail GB** - položky po kliknutí
4. **Kritické expirace** - spodní pás

### Záložka VYHLEDÁVÁNÍ:
1. **Fulltext pole** - nahoře
2. **Stromová struktura** - vlevo
3. **Výsledky** - vpravo
4. **Export tlačítka** - pod výsledky

### Barevné kódování:
- 🟢 **Zelená**: Volná pozice
- 🔵 **Modrá**: GB s nesledovanými položkami
- 🟠 **Oranžová**: GB se sledovanými položkami (OK)
- 🟠🟡 **Oranžová+šrafování**: Neúplně naplněný GB (<80%)
- 🔴 **Červená**: GB s kritickými expiraci

---

## 📋 TESTOVACÍ DATA

### Lokace:
- Mošnov: Regál A (3x9=27), Regál B (4x4=16)
- Kopřivnice: Hala Regál 1 (4x6=24), Hala Regál 2 (4x6=24), Zkušebna (3x8=24)
- **Celkem pozic: 115**

### Test GB:
- GB #1-10: Různé stavy naplněnosti a expirací
- GB #42: Jan Novák, 3 položky, 65% naplněn
- GB #23: Marie Svoboda, kritická expirace

---

## ⚡ PRIORITNÍ ÚKOLY NA ZAČÁTEK

1. **Setup projektu** - struktura, závislosti
2. **Databázové modely** - SQLAlchemy schéma  
3. **Test data** - naplnění skladu pro testování
4. **Základní API** - CRUD operace
5. **HTML kostra** - dvě záložky, layout

---

## 🔍 KONTROLNÍ SEZNAMY

### Backend hotový když:
- [ ] Všechny API endpointy fungují
- [ ] Globální číslování GB implementováno
- [ ] Expirační logika dokončena
- [ ] Validace a error handling
- [ ] Testy pokrývají core funkcionalitu

### Frontend hotový když:
- [ ] Obě záložky plně funkční
- [ ] Vizualizace regálů interaktivní
- [ ] Formuláře validované
- [ ] Export do PDF/Excel
- [ ] Responsivní design

### Aplikace připravená k nasazení když:
- [ ] Všechny funkce otestované
- [ ] Dokumentace kompletní
- [ ] Performance optimalizace hotova
- [ ] Deployment postup popsán
- [ ] Backup strategie definovaná

---

## 🚧 ZNÁMÉ VÝZVY

1. **Globální číslování** - zajistit konzistenci při mazání GB
2. **Vizuální šrafování** - CSS implementace pro neúplné GB
3. **Fulltext search** - výkon u velkých dat
4. **PDF export** - kvalitní layout tabulek
5. **Stromová struktura** - dynamické rozbalování

---

*Plán vytvořen: 27.7.2025*  
*Odhadovaná doba dokončení: 8 týdnů*  
*Verze: 1.0*
