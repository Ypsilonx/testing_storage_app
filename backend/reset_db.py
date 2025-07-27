"""
Skript pro reset databáze a vytvoření nových testovacích dat
Autor: GitHub Copilot  
Datum: 27.7.2025
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.database import SessionLocal, engine
from backend.models import Base, Gitterbox, Item, Position
from backend.database import init_database
from datetime import datetime, timedelta
import random


def reset_database():
    """Smaže všechna data a znovu vytvoří čisté testovací prostředí"""
    
    print("🗑️  Resetuji databázi...")
    
    # Smazání všech tabulek
    Base.metadata.drop_all(bind=engine)
    print("✅ Všechny tabulky smazány")
    
    # Znovu vytvoření tabulek a základních dat
    init_database()
    print("✅ Databáze znovu inicializována")
    
    # Vytvoření testovacích GB
    create_test_data()


def create_test_data():
    """Vytvoří čisté testovací Gitterboxy"""
    
    db = SessionLocal()
    try:
        print("🔄 Vytvářím testovací Gitterboxy...")
        
        # Reset všech pozic na volné
        db.query(Position).update({"status": "volna"})
        
        # Testovací GB data
        test_gb_data = [
            {
                "cislo_gb": 5,
                "position_id": 5,
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
                "poznamka": "Částečně naplněný GB - kritická expirace!"
            },
            {
                "cislo_gb": 42,
                "position_id": 32,  # Jiná pozice
                "zodpovedna_osoba": "Anna Kratochvílová",
                "naplnenost_procenta": 65,
                "poznamka": "Hlavní testovací GB"
            }
        ]
        
        for gb_data in test_gb_data:
            # Vytvoření GB
            gb = Gitterbox(**gb_data)
            db.add(gb)
            db.flush()  # Získání ID
            
            # Označení pozice jako obsazené
            pozice = db.query(Position).filter(Position.id == gb.position_id).first()
            if pozice:
                pozice.status = "obsazena"
            
            # Vytvoření testovacích položek
            create_test_items(db, gb)
        
        db.commit()
        
        # Statistiky
        gb_count = db.query(Gitterbox).count()
        item_count = db.query(Item).count()
        
        print(f"\n✅ Testovací data vytvořena!")
        print(f"📦 Gitterboxy: {gb_count}")
        print(f"📝 Položky: {item_count}")
        
        # Zobrazení vytvořených GB
        print("\n📋 Vytvořené testovací Gitterboxy:")
        for gb in db.query(Gitterbox).all():
            items = db.query(Item).filter(Item.gitterbox_id == gb.id, Item.stav == "aktivni").all()
            kriticky = any(item.je_blizko_expirace for item in items if item.sledovat_expiraci)
            status = "⚠️ KRITICKÁ EXPIRACE" if kriticky else "✅"
            print(f"  GB #{gb.cislo_gb} - {gb.zodpovedna_osoba} - {len(items)} položek ({gb.naplnenost_procenta}%) {status}")
        
    except Exception as e:
        print(f"❌ Chyba při vytváření dat: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_test_items(db, gb):
    """Vytvoří testovací položky pro GB"""
    
    # Projekty a díly
    projekty = ["Projekt Alpha", "Beta Test", "Gamma Development", None]
    dily = [
        "Motor komponenta", "Elektronická část", "Mechanický díl",
        "Testovací vzorek", "Prototyp", "Senzor", "Aktuátor"
    ]
    
    # Počet položek podle GB
    if gb.cislo_gb == 23:
        # GB s kritickou expirací
        pocet_polozek = 3
    else:
        pocet_polozek = random.randint(2, 4)
    
    for i in range(pocet_polozek):
        # Datum zaskladnění
        if gb.cislo_gb == 23 and i == 0:
            # První položka v GB #23 má kritickou expiraci (před 360 dny)
            datum_zask = datetime.now().date() - timedelta(days=360)
        else:
            datum_zask = datetime.now().date() - timedelta(days=random.randint(30, 200))
        
        sledovat = True if gb.cislo_gb == 23 else random.choice([True, True, False])
        
        # TMA číslo ve správném formátu
        tma_cislo = None
        if sledovat:
            tma_cislo = f"EU-SVA-{random.randint(100000, 999999):06d}-25"
        
        polozka = Item(
            gitterbox_id=gb.id,
            tma_cislo=tma_cislo,
            projekt=random.choice(projekty),
            nazev_dilu=random.choice(dily),
            pocet_kusu=random.randint(5, 50),
            jednotka="ks",
            datum_zaskladneni=datum_zask,
            sledovat_expiraci=sledovat,
            poznamka=f"Test položka {i+1}" if random.choice([True, False]) else None
        )
        
        if sledovat:
            polozka.expiracni_datum = datum_zask + timedelta(days=365)
        
        db.add(polozka)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        reset_database()
    else:
        print("Použij: python reset_db.py --reset")
        print("Toto smaže všechna data v databázi!")
