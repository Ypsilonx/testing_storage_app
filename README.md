# Skladová aplikace pro správu Gitterboxů

Webová aplikace pro správu skladu s vizualizací regálů a sledováním expirací položek.

## 🎯 Klíčové funkce

- **Globální číslování GB** - čísla 1 až max pozic celého skladu
- **Dvoustupňové workflow** - založení GB → přidávání položek
- **Vizualizace regálů** - barevné kódování podle stavu
- **Flexibilní sledování** - volitelné TMA čísla a expirace
- **Fulltext vyhledávání** - se stromovou strukturou skladu
- **Export funkcionalita** - PDF/Excel výstupy

## 🏗️ Technologie

- **Backend**: Python FastAPI + SQLAlchemy + SQLite
- **Frontend**: HTML/CSS/JavaScript + Tailwind CSS
- **Database**: SQLite (development), PostgreSQL ready

## 📊 Struktura skladu

### Lokace:
- **Mošnov**: Regál A (3×9), Regál B (4×4) = 43 pozic
- **Kopřivnice**: Hala regál 1 (4×6), Hala regál 2 (4×6), Zkušebna (3×8) = 72 pozic
- **Celkem**: 115 pozic pro Gitterboxy

### Barevné kódování:
- 🟢 **Zelená**: Volná pozice
- 🔵 **Modrá**: GB s nesledovanými položkami
- 🟠 **Oranžová**: GB se sledovanými položkami (OK)
- 🟠🟡 **Oranžová+šrafování**: Neúplně naplněný GB (<80%)
- 🔴 **Červená**: GB s kritickými expiraci

## 🚀 Instalace a spuštění

```bash
# Instalace závislostí
pip install -r requirements.txt

# Spuštění aplikace
uvicorn backend.main:app --reload

# Aplikace běží na http://localhost:8050
```

## 📁 Struktura projektu

```
testing_storage_app/
├── backend/                 # FastAPI backend
│   ├── main.py             # Hlavní aplikace
│   ├── models.py           # SQLAlchemy modely
│   ├── database.py         # DB konfigurace
│   ├── routers/            # API endpointy
│   ├── services/           # Business logika
│   └── static/             # Frontend soubory
├── tests/                  # Testy
├── docs/                   # Dokumentace
├── PROJECT_PLAN.md         # Detailní plán vývoje
├── requirements.txt        # Python závislosti
└── README.md              # Tento soubor
```

## 📋 Aktuální stav vývoje

Viz [PROJECT_PLAN.md](PROJECT_PLAN.md) pro detailní roadmapu a progress tracking.

### Hotovo:
- [x] ✅ Plán a architektura
- [x] ✅ Struktura projektu
- [x] ✅ Roadmapa
- [x] ✅ **FÁZE 1 KOMPLETNÍ**: Základní backend s databází a API

### Aktuálně pracujeme na:
- [ ] 🔄 Fáze 2: Gitterbox management a číslování

## 🎮 Hlavní UI

### Záložka REGÁLY
- Přehled Gitterboxů s rychlými informacemi
- Interaktivní vizualizace regálů
- Detail GB po kliknutí
- Kritické expirace

### Záložka VYHLEDÁVÁNÍ  
- Fulltext vyhledávání
- Stromová struktura skladu
- Export do PDF/Excel
- Detailní seznamy položek

## 🔧 Konfigurace

Aplikace používá `.env` soubor pro konfiguraci:

```env
DATABASE_URL=sqlite:///./storage.db
SECRET_KEY=your-secret-key
DEBUG=True
```

## 📖 Dokumentace

- [PROJECT_PLAN.md](PROJECT_PLAN.md) - Kompletní plán vývoje
- [API dokumentace](http://localhost:8000/docs) - FastAPI Swagger UI
- [Redoc dokumentace](http://localhost:8000/redoc) - Alternativní API docs

## 🤝 Přispívání

1. Následuj plán v `PROJECT_PLAN.md`
2. Každý commit by měl posunout nějaký checkbox v plánu
3. Testuj funkcionalitu před commitem
4. Používej české komentáře pro business logiku

## 📝 Licence

Interní projekt - všechna práva vyhrazena.

---

*Vytvořeno: 27.7.2025*  
*Verze: 1.0*
