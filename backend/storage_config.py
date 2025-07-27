"""
Konfigurace skladu - zde můžeš snadno upravovat velikosti regálů
Autor: GitHub Copilot
Datum: 27.7.2025
"""

# Konfigurace lokací a regálů
STORAGE_CONFIG = {
    "locations": [
        {
            "nazev": "Mošnov",
            "popis": "Hlavní sklad",
            "regaly": [
                {"nazev": "Regál A", "radky": 3, "sloupce": 9, "typ": "hlavní"},      # 27 pozic
                {"nazev": "Regál B", "radky": 4, "sloupce": 4, "typ": "menší"},      # 16 pozic
            ]
        },
        {
            "nazev": "Kopřivnice", 
            "popis": "Pobočka",
            "regaly": [
                {"nazev": "Hala - Regál 1", "radky": 4, "sloupce": 6, "typ": "hala"},      # 24 pozic
                {"nazev": "Hala - Regál 2", "radky": 4, "sloupce": 6, "typ": "hala"},      # 24 pozic  
                {"nazev": "Zkušebna", "radky": 3, "sloupce": 8, "typ": "zkušebna"},        # 24 pozic
            ]
        }
    ]
}

def get_total_positions():
    """Vypočítá celkový počet pozic ve všech regálech"""
    total = 0
    for location in STORAGE_CONFIG["locations"]:
        for regal in location["regaly"]:
            total += regal["radky"] * regal["sloupce"]
    return total

def get_storage_summary():
    """Vrací přehled konfigurace skladu"""
    summary = {
        "celkem_lokaci": len(STORAGE_CONFIG["locations"]),
        "celkem_regalu": sum(len(loc["regaly"]) for loc in STORAGE_CONFIG["locations"]),
        "celkem_pozic": get_total_positions(),
        "max_cislo_gb": get_total_positions(),
        "detail": []
    }
    
    for location in STORAGE_CONFIG["locations"]:
        loc_pozic = sum(r["radky"] * r["sloupce"] for r in location["regaly"])
        summary["detail"].append({
            "lokace": location["nazev"],
            "regaly": len(location["regaly"]),
            "pozice": loc_pozic
        })
    
    return summary

# Příklady různých konfigurací:

# MALÝ SKLAD (pro testování)
SMALL_CONFIG = {
    "locations": [
        {
            "nazev": "Testovací sklad",
            "popis": "Malý sklad pro vývoj", 
            "regaly": [
                {"nazev": "Regál 1", "radky": 2, "sloupce": 3, "typ": "test"},    # 6 pozic
                {"nazev": "Regál 2", "radky": 3, "sloupce": 2, "typ": "test"},    # 6 pozic
            ]
        }
    ]
}  # Celkem 12 pozic, GB čísla 1-12

# STŘEDNÍ SKLAD
MEDIUM_CONFIG = {
    "locations": [
        {
            "nazev": "Sklad A",
            "popis": "Hlavní sklad",
            "regaly": [
                {"nazev": "Regál 1", "radky": 5, "sloupce": 8, "typ": "hlavní"},   # 40 pozic
                {"nazev": "Regál 2", "radky": 4, "sloupce": 6, "typ": "vedlejší"}, # 24 pozic
            ]
        }
    ]
}  # Celkem 64 pozic, GB čísla 1-64

# VELKÝ SKLAD  
LARGE_CONFIG = {
    "locations": [
        {
            "nazev": "Centrální sklad",
            "popis": "Hlavní centrála",
            "regaly": [
                {"nazev": "Hala A", "radky": 10, "sloupce": 15, "typ": "hlavní"},    # 150 pozic
                {"nazev": "Hala B", "radky": 8, "sloupce": 12, "typ": "hlavní"},     # 96 pozic
                {"nazev": "Rezerva", "radky": 5, "sloupce": 10, "typ": "rezervní"},  # 50 pozic
            ]
        },
        {
            "nazev": "Pobočka 1",
            "popis": "Místní pobočka",
            "regaly": [
                {"nazev": "Regál A", "radky": 6, "sloupce": 8, "typ": "pobočka"},    # 48 pozic
            ]
        }
    ]
}  # Celkem 344 pozic, GB čísla 1-344

# Aktivní konfigurace - změň tuto proměnnou pro jiný sklad
# ACTIVE_CONFIG = STORAGE_CONFIG    # Původní (115 pozic)
# ACTIVE_CONFIG = SMALL_CONFIG      # Malý (12 pozic) 
# ACTIVE_CONFIG = MEDIUM_CONFIG     # Střední (64 pozic)
# ACTIVE_CONFIG = LARGE_CONFIG      # Velký (344 pozic)

ACTIVE_CONFIG = STORAGE_CONFIG  # 👈 ZMĚŇ TUTO ŘÁDKU PRO JINOU VELIKOST

if __name__ == "__main__":
    # Test konfigurace
    summary = get_storage_summary()
    print("📦 Přehled konfigurace skladu:")
    print(f"   Lokace: {summary['celkem_lokaci']}")
    print(f"   Regály: {summary['celkem_regalu']}")
    print(f"   Pozice: {summary['celkem_pozic']}")
    print(f"   GB čísla: 1-{summary['max_cislo_gb']}")
    
    for detail in summary["detail"]:
        print(f"   • {detail['lokace']}: {detail['regaly']} regálů, {detail['pozice']} pozic")
