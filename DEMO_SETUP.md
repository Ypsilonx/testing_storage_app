# 🎯 DEMO SETUP - Skladová aplikace

## Rychlé spuštění pro ukázku

### Požadavky:
- Python 3.9+ nainstalovaný
- VS Code (doporučeno) nebo jakýkoli terminál

### Kroky spuštění:

1. **Rozbalit/zkopírovat** tuto složku kamkoliv na PC

2. **Otevřít terminál** v kořenovém adresáři projektu

3. **Vytvořit Python prostředí:**
   ```cmd
   python -m venv .venv
   ```

4. **Aktivovat prostředí:**
   ```cmd
   # Windows
   .venv\Scripts\activate
   
   # Linux/Mac  
   source .venv/bin/activate
   ```

5. **Instalovat závislosti:**
   ```cmd
   pip install -r requirements.txt
   ```

6. **Spustit aplikaci:**
   ```cmd
   cd backend
   python start_server.py
   ```

7. **Otevřít v prohlížeči:**
   ```
   http://localhost:8000
   ```

---

## 🎮 Co můžete vyzkoušet:

### Záložka REGÁLY:
- Proklikejte si různé regály (dropdown nahoře)
- Klikejte na pozice GB - zobrazí se detaily
- Zkuste vytvořit nový GB tlačítkem "Nový GB"
- Přidejte položky do existujícího GB

### Záložka VYHLEDÁVÁNÍ:  
- Zkuste fulltext vyhledávání (např. "test", "marie", "paletka")
- Použijte filtry - osoba, projekt
- Export do PDF/Excel tlačítky dole
- Proklikněte breadcrumb navigaci

### Správa regálů:
- V levém panelu "Správa systému" → "Upravit regály"
- Zkuste změnit názvy regálů
- ⚠️ Změna velikosti regálu je chráněna proti ztrátě dat

### Archivace:
- V levém panelu "Expirované položky" - archivujte staré položky
- Stáhněte archivní Excel export

---

## 🔧 Možné problémy:

**"python not found"** → Nainstalujte Python z python.org

**"Permission denied"** → Spusťte terminál jako Administrator

**"Port 8000 in use"** → Změňte port v start_server.py nebo ukončete jiný proces

**Databáze chyby** → Smažte storage.db a spusťte: `python reset_db.py && python init_test_data.py`

---

## 📊 Testovací data:

Aplikace obsahuje předpřipravená data:
- **5 lokací** - Mošnov, Kopřivnice, atd.
- **8 regálů** - různé velikosti a typy  
- **13 Gitterboxů** - s různými stavy naplněnosti
- **25+ položek** - s expirací, projekty, TMA čísla
- **115 pozic celkem** - kompletní sklad k testování

---

*Připraveno pro demo: 6.8.2025*  
*Verze aplikace: 1.4*
