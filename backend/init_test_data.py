"""
Skript pro vytvoření testovacích dat
Autor: GitHub Copilot  
Datum: 27.7.2025
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.database import SessionLocal, init_database
from backend.models import Gitterbox, Item
from datetime import datetime, timedelta
import random


def create_test_gitterboxes():
    """Vytvoří testovací Gitterboxy s položkami"""
    
    init_database()  # Nejdřív inicializace základních dat
    
    db = SessionLocal()
    try:
        # Kontrola zda už existují testovací GB
        existing_gb = db.query(Gitterbox).count()
        if existing_gb > 0:
            print("✅ Testovací Gitterboxy už existují, přeskakuji vytvoření")
            return
        
        print("🔄 Vytvářím testovací Gitterboxy...")
        
        # Testovací osoby
        osoby = ["Jan Novák", "Marie Svoboda", "Petr Dvořák", "Anna Černá", "Pavel Novotný"]
        
        # Testovací projekty
        projekty = ["Projekt Alpha", "Beta Test", "Gamma Development", "Delta Research", None]
        
        # Testovací TMA čísla
        tma_cisla = ["TMA-001", "TMA-123", "TMA-456", "TMA-789", None]
        
        # Testovací díly
        dily = [
            "Vzorek A", "Motor komponenta", "Elektronická část", "Mechanický díl",
            "Testovací vzorek", "Náhradní díl", "Prototyp", "Dokumentace",
            "Kabeláž", "Senzor", "Aktuátor", "Řídicí jednotka"
        ]
        
        # Vytvoření testovacích GB
        test_gb_data = [
            {
                "cislo_gb": 5,
                "position_id": 5,  # Pozice A5 v prvním regálu
                "zodpovedna_osoba": "Jan Novák",
                "naplnenost_procenta": 75,
                "poznamka": "Testovací GB s mix položkami"
            },
            {
                "cislo_gb": 12,
                "position_id": 12,
                "zodpovedna_osoba": "Marie Svoboda", 
                "naplnenost_procenta": 95,
                "poznamka": "Téměř plný GB"
            },
            {
                "cislo_gb": 23,
                "position_id": 23,
                "zodpovedna_osoba": "Petr Dvořák",
                "naplnenost_procenta": 45,
                "poznamka": "Částečně naplněný GB"
            },
            {
                "cislo_gb": 42,
                "position_id": 15,  # Pozice B6
                "zodpovedna_osoba": "Jan Novák",
                "naplnenost_procenta": 65,
                "poznamka": "Hlavní testovací GB z návrhu"
            }
        ]
        
        for gb_data in test_gb_data:
            # Vytvoření GB
            gb = Gitterbox(**gb_data)
            db.add(gb)
            db.flush()  # Získání ID pro vztahy
            
            # Aktualizace pozice na obsazenou
            from backend.models import Position
            pozice = db.query(Position).filter(Position.id == gb.position_id).first()
            if pozice:
                pozice.status = "obsazena"
            
            # Vytvoření položek pro GB
            pocet_polozek = random.randint(2, 5)
            
            for i in range(pocet_polozek):
                # Různé typy položek
                if i == 0:
                    # První položka s blízkou expirací pro GB #23
                    datum_zask = datetime.now().date() - timedelta(days=340) if gb.cislo_gb == 23 else datetime.now().date() - timedelta(days=random.randint(0, 200))
                else:
                    datum_zask = datetime.now().date() - timedelta(days=random.randint(0, 300))
                
                sledovat = random.choice([True, True, True, False])  # 75% šance na sledování
                
                polozka = Item(
                    gitterbox_id=gb.id,
                    tma_cislo=random.choice(tma_cisla) if sledovat else None,
                    projekt=random.choice(projekty),
                    nazev_dilu=random.choice(dily),
                    pocet_kusu=random.randint(1, 100),
                    jednotka=random.choice(["ks", "kg", "m", "l"]),
                    datum_zaskladneni=datum_zask,
                    sledovat_expiraci=sledovat,
                    poznamka=f"Testovací položka {i+1}" if random.choice([True, False]) else None
                )
                
                # Expirace se nastaví automaticky v modelu
                if sledovat:
                    polozka.expiracni_datum = datum_zask + timedelta(days=365)
                
                db.add(polozka)
        
        db.commit()
        
        # Statistiky
        gb_count = db.query(Gitterbox).count()
        item_count = db.query(Item).count()
        
        print(f"✅ Testovací data vytvořena!")
        print(f"📦 Gitterboxy: {gb_count}")
        print(f"📝 Položky: {item_count}")
        
        # Zobrazení konkrétních GB
        print("\n📋 Vytvořené testovací Gitterboxy:")
        for gb in db.query(Gitterbox).all():
            print(f"  GB #{gb.cislo_gb} - {gb.zodpovedna_osoba} - {gb.pocet_polozek} položek ({gb.naplnenost_procenta}%)")
            if gb.ma_kriticke_expirace:
                print(f"    ⚠️  Obsahuje kritické expirace!")
        
    except Exception as e:
        print(f"❌ Chyba při vytváření testovacích dat: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_test_gitterboxes()
