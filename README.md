# 📦 Skladová Aplikace pro Správu Gitterboxů# Skladová aplikace pro správu Gitterboxů



<div align="center">Webová aplikace pro správu skladu s vizualizací regálů a sledováním expirací položek.



![Version](https://img.shields.io/badge/version-1.4-blue.svg)## 🎯 Klíčové funkce

![Python](https://img.shields.io/badge/python-3.9+-green.svg)

![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)- **Globální číslování GB** - čísla 1 až max pozic celého skladu

![License](https://img.shields.io/badge/license-MIT-blue.svg)- **Dvoustupňové workflow** - založení GB → přidávání položek

- **Vizualizace regálů** - barevné kódování podle stavu

**Moderní webová aplikace pro správu skladu s vizualizací regálů a sledováním expirací položek**- **Flexibilní sledování** - volitelné TMA čísla a expirace

- **Fulltext vyhledávání** - se stromovou strukturou skladu

[🚀 Začít](#-quick-start) •- **Export funkcionalita** - PDF/Excel výstupy

[📖 Dokumentace](#-dokumentace) •

[✨ Funkce](#-klíčové-funkce) •## 🏗️ Technologie

[🛠️ Instalace](#️-instalace) •

[🤝 Přispět](#-přispívání)- **Backend**: Python FastAPI + SQLAlchemy + SQLite

- **Frontend**: HTML/CSS/JavaScript + Tailwind CSS

</div>- **Database**: SQLite (development), PostgreSQL ready



---## 📊 Struktura skladu



## 📋 O Projektu### Lokace:

- **Mošnov**: Regál A (3×9), Regál B (4×4) = 43 pozic

Skladová aplikace je komplexní systém pro efektivní správu skladu s důrazem na intuitivní vizualizaci, flexibilní sledování expirací a pokročilé vyhledávání. Ideální pro firmy využívající Gitterboxy (kovové paletové kontejnery) pro skladování.- **Kopřivnice**: Hala regál 1 (4×6), Hala regál 2 (4×6), Zkušebna (3×8) = 72 pozic

- **Celkem**: 115 pozic pro Gitterboxy

### 🎯 Hlavní výhody

### Barevné kódování:

- **Vizuální přehled** - Interaktivní mřížka regálů s barevným kódováním stavů- 🟢 **Zelená**: Volná pozice

- **Globální číslování** - Jednotný systém číslování pro celý sklad- 🔵 **Modrá**: GB s nesledovanými položkami

- **Flexibilní tracking** - Volitelné sledování TMA čísel, projektů a expirací- 🟠 **Oranžová**: GB se sledovanými položkami (OK)

- **Pokročilé vyhledávání** - Fulltext search se stromovou strukturou- 🟠🟡 **Oranžová+šrafování**: Neúplně naplněný GB (<80%)

- **Export & Reporting** - PDF a Excel výstupy pro reporting- 🔴 **Červená**: GB s kritickými expiraci

- **Archivace** - Kompletní historie vyskladnění s důvody

## 🚀 Instalace a spuštění

---

```bash

## ✨ Klíčové Funkce# Instalace závislostí

pip install -r requirements.txt

### 📊 Vizualizace Skladu

- **Interaktivní regálové mřížky** - klikatelné pozice s detailními informacemi# Spuštění aplikace

- **Barevné kódování**:uvicorn backend.main:app --reload

  - 🟢 Volná pozice

  - 🔵 Obsazená pozice (100% naplněné)# Aplikace běží na http://localhost:8050

  - 🟠 Částečně naplněná (<100%)```

  - 🔴 Kritické expirace (blikající alert)

- **Skladové číslování** - warehouse standard (řádek-sloupec, zdola nahoru)## 📁 Struktura projektu

- **Responsive design** - automatické škálování šířky regálů

```

### 🔍 Vyhledávání & Filtrytesting_storage_app/

- **Fulltext search** - prohledávání všech atributů (název, TMA, projekt, osoba)├── backend/                 # FastAPI backend

- **Stromová struktura** - hierarchické zobrazení lokace → regál → GB → položky│   ├── main.py             # Hlavní aplikace

- **Pokročilé filtry**:│   ├── models.py           # SQLAlchemy modely

  - Zodpovědná osoba (dropdown)│   ├── database.py         # DB konfigurace

  - Projekt (dropdown)│   ├── routers/            # API endpointy

  - Lokace (multi-select)│   ├── services/           # Business logika

  - Stav položek (aktivní/archivované)│   └── static/             # Frontend soubory

- **Cross-tab navigace** - přechod mezi záložkami s kontextem├── tests/                  # Testy

├── docs/                   # Dokumentace

### 📦 Správa Gitterboxů├── PROJECT_PLAN.md         # Detailní plán vývoje

- **Dvoustupňové workflow**:├── requirements.txt        # Python závislosti

  1. Založení GB s výběrem pozice└── README.md              # Tento soubor

  2. Postupné přidávání položek```

- **Globální číslování** - čísla 1 až max pozic celého skladu

- **Uživatelský výběr čísel** - s real-time validací dostupnosti## 📋 Aktuální stav vývoje

- **Naplněnost tracking** - vizuální indikace 0-100%

- **Breadcrumb navigace** - orientace v kontextu GBViz [PROJECT_PLAN.md](PROJECT_PLAN.md) pro detailní roadmapu a progress tracking.



### 📝 Položky & Expirace### Hotovo:

- **Flexibilní položky**:- [x] ✅ Plán a architektura

  - TMA číslo (volitelné)- [x] ✅ Struktura projektu

  - Projekt (volitelný)- [x] ✅ Roadmapa

  - Počet kusů + jednotka- [x] ✅ **FÁZE 1 KOMPLETNÍ**: Základní backend s databází a API

  - Sledování expirace (lze vypnout)

- **Automatická expirace** - výchozí 1 rok od zaskladnění### Aktuálně pracujeme na:

- **Expiry tracking** - přehled položek blížících se expiraci (7/14/30 dní)- [ ] 🔄 Fáze 2: Gitterbox management a číslování

- **Kritické alerty** - automatické zobrazení v sidebaru

## 🎮 Hlavní UI

### 📤 Export & Archivace

- **PDF export** - kompaktní layout s kompletními daty### Záložka REGÁLY

- **Excel export** - strukturovaný spreadsheet s auto-šířkou sloupců- Přehled Gitterboxů s rychlými informacemi

- **Inteligentní názvy** - dle filtrů (např. `Sklad_Cibulka_20251028.pdf`)- Interaktivní vizualizace regálů

- **Archivace vyskladnění**:- Detail GB po kliknutí

  - Důvody: expirace, rozbito, chyba, jiné- Kritické expirace

  - Excel export archivních dat

  - Automatické uvolnění pozic### Záložka VYHLEDÁVÁNÍ  

- Fulltext vyhledávání

### ⚙️ Administrace- Stromová struktura skladu

- **Správa regálů** - změna názvů a rozměrů- Export do PDF/Excel

- **Ochrana dat** - blokování změn velikosti obsazených regálů- Detailní seznamy položek

- **Automatická regenerace** - pozic při změnách rozměrů

- **Dashboard statistiky** - přehled obsazenosti (formát 13/115 GB)## 🔧 Konfigurace



---Aplikace používá `.env` soubor pro konfiguraci:



## 🏗️ Technologie```env

DATABASE_URL=sqlite:///./storage.db

### BackendSECRET_KEY=your-secret-key

- **FastAPI** - moderní, rychlý web frameworkDEBUG=True

- **SQLAlchemy** - ORM pro databázové operace```

- **SQLite** - development databáze (PostgreSQL ready)

- **Uvicorn** - ASGI server s hot-reload## 📖 Dokumentace



### Frontend- [PROJECT_PLAN.md](PROJECT_PLAN.md) - Kompletní plán vývoje

- **Vanilla JavaScript** - bez framework overhead- [API dokumentace](http://localhost:8000/docs) - FastAPI Swagger UI

- **Tailwind CSS** - utility-first styling- [Redoc dokumentace](http://localhost:8000/redoc) - Alternativní API docs

- **Responsive design** - mobile-friendly UI

- **Dark mode** - tmavý režim s Consolas fontem## 🤝 Přispívání



### Export & Reporting1. Následuj plán v `PROJECT_PLAN.md`

- **ReportLab** - generování PDF dokumentů2. Každý commit by měl posunout nějaký checkbox v plánu

- **OpenPyXL** - Excel soubory s pokročilým formátováním3. Testuj funkcionalitu před commitem

- **Unicode support** - plná podpora češtiny (Arial, DejaVu fonts)4. Používej české komentáře pro business logiku



---## 📝 Licence



## 🚀 Quick StartInterní projekt - všechna práva vyhrazena.



### Požadavky---

- Python 3.9+

- pip (Python package manager)*Vytvořeno: 27.7.2025*  

- Git (volitelné)*Verze: 1.0*


### Instalace za 3 kroky

```bash
# 1. Klonovat nebo stáhnout repozitář
git clone https://github.com/your-username/storage-app.git
cd storage-app

# 2. Vytvořit virtuální prostředí a nainstalovat závislosti
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
pip install -r requirements.txt

# 3. Spustit aplikaci
cd backend
python start_server.py
```

Aplikace běží na **http://localhost:8050** 🎉

---

## 🛠️ Instalace

### Krok 1: Příprava prostředí

```bash
# Klonování repozitáře
git clone https://github.com/your-username/storage-app.git
cd storage-app

# Vytvoření virtuálního prostředí
python -m venv .venv

# Aktivace prostředí
# Windows PowerShell
.venv\Scripts\Activate.ps1

# Windows CMD
.venv\Scripts\activate.bat

# Linux/macOS
source .venv/bin/activate
```

### Krok 2: Instalace závislostí

```bash
# Instalace Python balíčků
pip install -r requirements.txt

# Ověření instalace
python -c "import fastapi; print('FastAPI OK')"
```

### Krok 3: Konfigurace

```bash
# Vytvoření konfiguračního souboru
cp .env.example .env

# Editace konfigurace (volitelné)
nano .env  # nebo jakýkoli editor
```

**Důležité nastavení v `.env`:**
```env
DATABASE_URL=sqlite:///./storage.db
SECRET_KEY=change-this-in-production
DEBUG=True
CORS_ORIGINS=["http://localhost:8000"]
```

### Krok 4: Inicializace databáze

```bash
cd backend

# Reset databáze (smaže existující data!)
python reset_db.py

# Naplnění testovacími daty (volitelné)
python init_test_data.py
```

**Testovací data obsahují:**
- 5 lokací (Mošnov, Kopřivnice, ...)
- 8 regálů (různé velikosti)
- 13 Gitterboxů (různé stavy naplněnosti)
- 25+ položek (s expirací, projekty)
- 115 pozic celkem

### Krok 5: Spuštění

```bash
# Development server (auto-reload)
python start_server.py

# Produkční server (více workerů)
python start_production.py
```

**Aplikace běží na:**
- Frontend: http://localhost:8050
- API dokumentace: http://localhost:8050/api/docs
- Alternative docs: http://localhost:8050/api/redoc

---

## 📖 Dokumentace

### Uživatelská dokumentace

#### Záložka REGÁLY
1. **Výběr regálu** - dropdown menu nahoře
2. **Interaktivní mřížka** - klikněte na pozici pro detail
3. **Barevné indikace**:
   - Prázdná pozice (šedá) - volná k použití
   - Modrá - plně obsazená (100%)
   - Oranžová - částečně naplněná
   - Červená blikající - kritická expirace
4. **Nový Gitterbox** - tlačítko v levém panelu
5. **Detail GB** - kliknutím na pozici (zobrazí položky)

#### Záložka VYHLEDÁVÁNÍ
1. **Fulltext pole** - vyhledávání ve všech atributech
2. **Filtry** - osoba, projekt, lokace, stav
3. **Stromová struktura** - rozbalovací hierarchie
4. **Export tlačítka** - PDF a Excel výstupy
5. **Navigace** - breadcrumbs a cross-tab odkazy

#### Správa Regálů
1. **Přístup** - levý panel → "Správa systému" → "Upravit regály"
2. **Operace**:
   - Změna názvu regálu (klikněte na název)
   - Změna rozměrů (⚠️ pouze u prázdných regálů)
   - Smazání regálu (⚠️ pouze pokud je prázdný)

### API Dokumentace

Kompletní interaktivní API dokumentace dostupná na:
- **Swagger UI**: http://localhost:8050/api/docs
- **ReDoc**: http://localhost:8050/api/redoc

#### Hlavní endpointy:

**Gitterboxy:**
- `GET /api/gitterboxes/` - seznam všech GB
- `POST /api/gitterboxes/` - vytvoření nového GB
- `GET /api/gitterboxes/{id}` - detail GB
- `PUT /api/gitterboxes/{id}` - aktualizace GB
- `DELETE /api/gitterboxes/{id}` - soft delete GB

**Položky:**
- `GET /api/items/` - seznam položek
- `POST /api/items/` - přidání položky do GB
- `PUT /api/items/{id}` - aktualizace položky
- `GET /api/items/expired` - expirované položky
- `GET /api/items/expiring-soon` - blízké expirace

**Pozice:**
- `GET /api/positions/` - všechny pozice
- `GET /api/positions/available` - volné pozice
- `GET /api/positions/tree` - stromová struktura

**Export:**
- `GET /api/export/pdf` - PDF export aktuálních dat
- `GET /api/export/excel` - Excel export

**Archiv:**
- `POST /api/archive/item/{id}` - archivace položky
- `POST /api/archive/gitterbox/{id}` - archivace GB
- `GET /api/archive/export` - stažení archivu

---

## 📁 Struktura Projektu

```
storage-app/
├── backend/                    # Backend aplikace
│   ├── main.py                # FastAPI aplikace a routy
│   ├── models.py              # SQLAlchemy databázové modely
│   ├── database.py            # DB konfigurace a session management
│   ├── storage_config.py      # Skladová konfigurace (regály, lokace)
│   ├── start_server.py        # Development server
│   ├── start_production.py    # Production server
│   ├── reset_db.py            # Reset databáze
│   ├── init_test_data.py      # Inicializace testovacích dat
│   ├── routers/               # API routery
│   │   ├── gitterboxes.py    # CRUD operace pro GB
│   │   ├── items.py          # Správa položek
│   │   ├── positions.py      # Pozice a regály
│   │   ├── shelves.py        # Správa regálů
│   │   ├── archive.py        # Archivace a vyskladnění
│   │   └── export.py         # PDF/Excel exporty
│   ├── services/              # Business logika
│   │   └── archive_service.py
│   └── static/                # Frontend soubory
│       ├── index.html        # Hlavní HTML
│       ├── css/
│       │   └── style.css     # Custom CSS styly
│       └── js/
│           ├── app.js        # Hlavní aplikační logika
│           ├── api.js        # API komunikace
│           ├── regaly.js     # Záložka regály
│           ├── vyhledavani.js # Záložka vyhledávání
│           ├── modals.js     # Modal dialogy
│           └── admin.js      # Správa regálů
├── .github/                   # GitHub konfigurace
│   └── workflows/
│       └── ci.yml            # CI/CD pipeline
├── docs/                      # Dodatečná dokumentace
├── tests/                     # Unit testy (TODO)
├── .env.example              # Šablona konfigurace
├── .gitignore                # Git ignore pravidla
├── requirements.txt          # Python závislosti
├── requirements.prod.txt     # Produkční závislosti
├── LICENSE                   # MIT License
├── README.md                 # Tento soubor
├── CONTRIBUTING.md           # Návod pro přispěvatele
├── DEPLOYMENT.md             # Produkční deployment
├── DEMO_SETUP.md             # Quick demo setup
└── PROJECT_PLAN.md           # Detailní plán vývoje
```

---

## 🔧 Konfigurace

### Databázové schéma

```
locations (lokace)
  ├── shelves (regály)
  │     └── positions (pozice)
  │           └── gitterboxes (GB)
  │                 └── items (položky)
  └── (relace 1:N)
```

**Klíčové tabulky:**
- `locations` - skladové lokace (Mošnov, Kopřivnice)
- `shelves` - regály s rozměry (řádky × sloupce)
- `positions` - pozice v regálech (status: volná/obsazená)
- `gitterboxes` - hlavní kontejnery (GB číslo, osoba, naplněnost)
- `items` - položky uvnitř GB (TMA, projekt, expirace)

### Environment variables

| Proměnná | Výchozí | Popis |
|----------|---------|-------|
| `DATABASE_URL` | `sqlite:///./storage.db` | Připojovací řetězec k DB |
| `SECRET_KEY` | `demo-key...` | Bezpečnostní klíč (změnit v produkci!) |
| `DEBUG` | `True` | Debug režim (False v produkci) |
| `CORS_ORIGINS` | `["http://localhost:8000"]` | Povolené CORS domény |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |

---

## 🚀 Deployment

### Docker Deployment (doporučeno)

```bash
# Build image
docker build -t storage-app .

# Spuštění kontejneru
docker run -d -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/storage \
  -e SECRET_KEY=$(openssl rand -hex 32) \
  -e DEBUG=False \
  storage-app
```

### Systemd Service (Linux)

```bash
# Instalace služby
sudo cp storage-app.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable storage-app
sudo systemctl start storage-app

# Kontrola stavu
sudo systemctl status storage-app
```

### Detailní návod

Kompletní deployment dokumentace: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🤝 Přispívání

Rádi přivítáme příspěvky! Prosím přečtěte si [CONTRIBUTING.md](CONTRIBUTING.md) pro details o našem code of conduct a procesu pull requestů.

### Rychlý přehled

1. **Fork** repozitář
2. **Vytvořte** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commitněte** změny (`git commit -m 'feat: add amazing feature'`)
4. **Push** do branch (`git push origin feature/amazing-feature`)
5. **Otevřete** Pull Request

### Coding konvence

- **Python**: PEP 8 style guide
- **JavaScript**: ES6+ standardy
- **CSS**: Tailwind utility classes
- **Commits**: Conventional Commits formát
- **Komentáře**: České pro business logiku, anglické pro technické

---

## 📊 Roadmap

- [x] ✅ **Phase 1-7**: Core funkcionalita, vizualizace, export
- [x] ✅ **Phase 8**: Správa regálů s ochranou dat
- [ ] 🔄 **Phase 9**: Pokročilé funkce (notifikace, bulk operace)
- [ ] 📅 **Phase 10**: Analytics & Reporting (grafy, predikce)
- [ ] 📅 **Phase 11**: Integrace (API, QR kódy, webhooks)
- [ ] 📅 **Phase 12**: Mobile & PWA (offline, push notifikace)
- [ ] 📅 **Phase 13**: Production ready (Docker, PostgreSQL, monitoring)

Detailní plán: [PROJECT_PLAN.md](PROJECT_PLAN.md)

---

## 🐛 Známé Problémy

- [ ] Unit testy - plánované v Phase 9
- [ ] Authentication - budoucí implementace
- [ ] PostgreSQL migrace - Phase 13
- [ ] Mobile optimalizace - Phase 12

Reportujte bugy na [GitHub Issues](https://github.com/your-username/storage-app/issues)

---

## 📄 Licence

Tento projekt je licencován pod MIT License - viz [LICENSE](LICENSE) pro detaily.

---

## 👥 Autoři

- **Původní autor** - *Initial work* - [YourName](https://github.com/your-username)

Viz také seznam [přispěvatelů](https://github.com/your-username/storage-app/contributors).

---

## 🙏 Poděkování

- **FastAPI** - za excelentní web framework
- **Tailwind CSS** - za utility-first styling
- **SQLAlchemy** - za robustní ORM
- **GitHub Copilot** - za asistenci při vývoji

---

## 📞 Kontakt & Podpora

- 📧 Email: your.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/storage-app/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/storage-app/discussions)

---

<div align="center">

**[⬆ Zpět nahoru](#-skladová-aplikace-pro-správu-gitterboxů)**

Made with ❤️ for efficient warehouse management

</div>
