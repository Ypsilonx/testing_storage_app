# 🤝 Průvodce Přispívání

Děkujeme za váš zájem přispět do Skladové Aplikace! Tento dokument vás provede procesem přispívání.

## 📋 Obsah

- [Code of Conduct](#-code-of-conduct)
- [Jak mohu přispět?](#-jak-mohu-přispět)
- [Vývojové prostředí](#️-vývojové-prostředí)
- [Coding Guidelines](#-coding-guidelines)
- [Commit konvence](#-commit-konvence)
- [Pull Request proces](#-pull-request-proces)
- [Reportování bugů](#-reportování-bugů)
- [Návrhy funkcí](#-návrhy-funkcí)

---

## 📜 Code of Conduct

### Naše závazky

Jako přispěvatelé a správci se zavazujeme vytvořit prostředí bez obtěžování pro každého, bez ohledu na věk, tělesnou velikost, zdravotní postižení, etnický původ, pohlavní identitu a vyjádření, úroveň zkušeností, národnost, osobní vzhled, rasu, náboženství nebo sexuální identitu a orientaci.

### Naše standardy

**Příklady chování, které přispívá k vytvoření pozitivního prostředí:**
- Používání vstřícného a inkluzivního jazyka
- Respektování různých názorů a zkušeností
- Elegantní přijímání konstruktivní kritiky
- Zaměření na to, co je nejlepší pro komunitu
- Projevování empatie vůči ostatním členům komunity

**Příklady nepřijatelného chování:**
- Používání sexualizovaného jazyka nebo obrazů
- Trolling, urážlivé komentáře nebo osobní útoky
- Veřejné nebo soukromé obtěžování
- Zveřejňování soukromých informací ostatních bez explicitního povolení
- Jiné chování, které lze rozumně považovat za nevhodné v profesionálním prostředí

---

## 🚀 Jak mohu přispět?

### Typy příspěvků

Vítáme různé typy příspěvků:

1. **🐛 Opravy bugů** - Nalezli jste chybu? Vytvořte issue nebo rovnou pull request
2. **✨ Nové funkce** - Máte nápad na vylepšení? Nejdříve vytvořte issue k diskuzi
3. **📖 Dokumentace** - Vylepšení README, docstringy, tutoriály
4. **🧪 Testy** - Přidání unit testů, integration testů
5. **🎨 UI/UX** - Zlepšení vzhledu a použitelnosti
6. **♻️ Refactoring** - Zlepšení kvality kódu bez změny funkcionality

### Proces přispívání

1. **Fork** repozitář
2. **Clone** váš fork lokálně
3. **Vytvořte** nový branch pro vaši změnu
4. **Proveďte** změny
5. **Otestujte** své změny
6. **Commitněte** s jasným commit message
7. **Push** do vašeho forku
8. **Otevřete** Pull Request

---

## 🛠️ Vývojové prostředí

### Požadavky

- Python 3.9+
- Git
- VS Code (doporučeno) nebo jiný editor
- Virtual environment support

### Nastavení prostředí

```bash
# 1. Fork a clone repozitář
git clone https://github.com/your-username/storage-app.git
cd storage-app

# 2. Vytvořte virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# 3. Instalace závislostí
pip install -r requirements.txt
pip install -r requirements.prod.txt  # Produkční závislosti

# 4. Instalace dev závislostí
pip install pytest pytest-cov black flake8 mypy

# 5. Kopírování konfigurace
cp .env.example .env

# 6. Inicializace databáze
cd backend
python reset_db.py
python init_test_data.py

# 7. Spuštění aplikace
python start_server.py
```

### Doporučené VS Code rozšíření

- Python (Microsoft)
- Pylance (Microsoft)
- Python Docstring Generator
- GitLens
- Better Comments
- Prettier

---

## 📐 Coding Guidelines

### Python Code Style

Dodržujeme **PEP 8** s několika úpravami:

```python
# ✅ SPRÁVNĚ
def calculate_total_items(gitterbox_id: int, db: Session) -> int:
    """
    Vypočítá celkový počet položek v Gitterboxu.
    
    Args:
        gitterbox_id: ID Gitterboxu
        db: Databázová session
        
    Returns:
        Celkový počet kusů všech položek
    """
    items = db.query(Item).filter(Item.gitterbox_id == gitterbox_id).all()
    return sum(item.pocet_kusu for item in items)

# ❌ ŠPATNĚ
def calc_items(gb_id,db):
    items=db.query(Item).filter(Item.gitterbox_id==gb_id).all()
    return sum([item.pocet_kusu for item in items])
```

**Pravidla:**
- **Indentation**: 4 mezery (ne taby)
- **Line length**: Max 100 znaků (Python), 120 (komentáře)
- **Naming**:
  - `snake_case` pro funkce a proměnné
  - `PascalCase` pro třídy
  - `UPPER_CASE` pro konstanty
- **Docstrings**: Vždy pro public funkce/třídy (Google style)
- **Type hints**: Používejte kde je to možné

### JavaScript Code Style

```javascript
// ✅ SPRÁVNĚ
async function loadGitterboxDetails(gbId) {
    try {
        const response = await fetch(`/api/gitterboxes/${gbId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading GB details:', error);
        throw error;
    }
}

// ❌ ŠPATNĚ
function loadGBDetails(id){
  fetch('/api/gitterboxes/'+id).then(r=>r.json()).then(d=>d)
}
```

**Pravidla:**
- **ES6+**: Používejte moderní JavaScript
- **Async/await**: Preferujte před .then()
- **Const/let**: Nikdy `var`
- **Arrow functions**: Kde je to vhodné
- **Error handling**: Vždy try-catch pro async operace

### CSS/Tailwind

```html
<!-- ✅ SPRÁVNĚ -->
<div class="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
    <span class="text-white font-medium">GB #42</span>
</div>

<!-- ❌ ŠPATNĚ -->
<div class="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200 ease-in-out shadow-md border border-gray-700">
    <span class="text-white font-medium text-base leading-normal">GB #42</span>
</div>
```

**Pravidla:**
- **Tailwind first**: Používejte utility classes
- **Custom CSS**: Pouze pokud je opravdu nutný
- **Dark mode**: Vždy testujte tmavý režim
- **Responsive**: Mobile-first přístup

### Databáze & SQLAlchemy

```python
# ✅ SPRÁVNĚ - České názvy sloupců, anglická logika
class Gitterbox(Base):
    __tablename__ = 'gitterboxes'
    
    id = Column(Integer, primary_key=True)
    cislo_gb = Column(Integer, unique=True, nullable=False, index=True)
    zodpovedna_osoba = Column(String(100), nullable=False)
    datum_zalozeni = Column(Date, default=date.today)
    
    # Relationship s cascading delete
    items = relationship("Item", back_populates="gitterbox", cascade="all, delete-orphan")

# ❌ ŠPATNĚ
class GB(Base):
    __tablename__ = 'gb'
    id = Column(Integer, primary_key=True)
    number = Column(Integer)
    person = Column(String(100))
```

---

## 💬 Commit konvence

Používáme **Conventional Commits** formát:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Typy commitů

- `feat`: Nová funkce
- `fix`: Oprava chyby
- `docs`: Změny v dokumentaci
- `style`: Formátování (bílé znaky, středníky)
- `refactor`: Refactoring kódu
- `perf`: Zlepšení výkonu
- `test`: Přidání nebo úprava testů
- `build`: Změny build systému
- `ci`: Změny CI konfigurace
- `chore`: Údržba

### Příklady

```bash
# Nová funkce
git commit -m "feat(gitterboxes): add bulk update operation"

# Oprava bugu
git commit -m "fix(export): correct Excel encoding for Czech characters"

# Dokumentace
git commit -m "docs(readme): update installation instructions"

# Refactoring
git commit -m "refactor(database): optimize query for position availability"

# S detailním popisem
git commit -m "feat(archive): add batch archiving for expired items

Implementace:
- Nový endpoint /api/archive/batch
- Frontend tlačítko pro bulk operace
- Automatické generování Excel reportu

Closes #42"
```

---

## 🔄 Pull Request proces

### Před odesláním PR

1. **✅ Otestujte** - Ujistěte se, že vše funguje
2. **✅ Dokumentujte** - Aktualizujte README pokud je to potřeba
3. **✅ Formátujte** - Spusťte linter:
   ```bash
   black backend/
   flake8 backend/
   ```
4. **✅ Commitněte** - S jasným commit message
5. **✅ Push** - Do vašeho forku

### Vytvoření Pull Requestu

1. Jděte na GitHub a otevřete PR z vašeho branch do `main`
2. **Vyplňte template**:

```markdown
## Popis změn
Stručně popište, co váš PR dělá

## Typ změny
- [ ] Bug fix
- [ ] Nová funkce
- [ ] Breaking change
- [ ] Dokumentace

## Jak testovat
1. Spusťte aplikaci
2. Přejděte na ...
3. Klikněte na ...
4. Ověřte, že ...

## Checklist
- [ ] Můj kód dodržuje coding guidelines
- [ ] Provedl jsem self-review
- [ ] Přidal jsem komentáře pro složité části
- [ ] Aktualizoval jsem dokumentaci
- [ ] Moje změny negenerují warnings
- [ ] Přidal jsem testy pokud je to relevantní
- [ ] Všechny testy procházejí
```

### Review proces

1. **Automatické kontroly** - CI/CD musí projít
2. **Code review** - Maintainer zkontroluje kód
3. **Diskuze** - Možné požadavky na změny
4. **Merge** - Po schválení bude mergnut

---

## 🐛 Reportování bugů

### Před reportem

1. **Zkontrolujte** existující issues
2. **Aktualizujte** na poslední verzi
3. **Ověřte** reprodukovatelnost

### Vytvoření issue

Použijte tento template:

```markdown
## Popis bugu
Jasný a stručný popis co je špatně.

## Kroky k reprodukci
1. Jděte na '...'
2. Klikněte na '...'
3. Scrollujte dolů na '...'
4. Vidíte chybu

## Očekávané chování
Co mělo správně nastat.

## Aktuální chování
Co se skutečně stalo.

## Screenshots
Pokud je to relevantní, přidejte screenshots.

## Prostředí
- OS: [e.g. Windows 11]
- Python: [e.g. 3.11.4]
- Browser: [e.g. Chrome 120]
- Verze aplikace: [e.g. 1.4]

## Dodatečný kontext
Jakékoli další informace o problému.

## Možné řešení
Pokud máte nápad jak to opravit (volitelné).
```

---

## 💡 Návrhy funkcí

### Feature Request template

```markdown
## Je váš návrh funkcivity související s problémem?
Jasný popis problému. Např. "Jsem frustrován když..."

## Popis řešení
Co by chtěl aby aplikace dělala.

## Alternativy
Jaké alternativní řešení jste zvažovali.

## Dodatečný kontext
Screenshots, mockupy, odkazy na podobné implementace.

## Priorita
- [ ] Nice to have
- [ ] Should have
- [ ] Must have

## Odhadovaná náročnost
- [ ] Malá (< 4 hodiny)
- [ ] Střední (4-16 hodin)
- [ ] Velká (> 16 hodin)
```

---

## 📚 Další zdroje

- [Python PEP 8](https://peps.python.org/pep-0008/)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🙏 Děkujeme!

Každý příspěvek, ať už velký nebo malý, je velmi ceněný! Děkujeme, že pomáháte zlepšovat Skladovou Aplikaci.

---

*Máte otázky? Neváhejte se zeptat v [GitHub Discussions](https://github.com/your-username/storage-app/discussions)!*
