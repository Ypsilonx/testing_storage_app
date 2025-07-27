"""
Databázová konfigurace pro skladovou aplikaci
Autor: GitHub Copilot
Datum: 27.7.2025
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

# Načtení environment proměnných
load_dotenv()

# Databázová URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./storage.db")

# SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=os.getenv("DEBUG", "False").lower() == "true"  # SQL logging v debug módu
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pro modely
Base = declarative_base()


def get_database():
    """
    Dependency injection pro FastAPI
    Vrací databázovou session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    Vytvoří všechny tabulky v databázi
    """
    from .models import Base
    Base.metadata.create_all(bind=engine)
    

def init_database():
    """
    Inicializuje databázi s základními daty
    """
    create_tables()
    
    # Import zde kvůli circular imports
    from .models import Location, Shelf, Position
    from .storage_config import ACTIVE_CONFIG
    
    db = SessionLocal()
    try:
        # Kontrola zda už nejsou data v databázi
        existing_locations = db.query(Location).count()
        if existing_locations > 0:
            print("✅ Databáze už obsahuje data, přeskakuji inicializaci")
            return
        
        print("🔄 Inicializuji databázi podle konfigurace...")
        
        # Vytvoření lokací a regálů podle konfigurace
        pozice_celkem = 0
        
        for location_config in ACTIVE_CONFIG["locations"]:
            # Vytvoření lokace
            location = Location(
                nazev=location_config["nazev"], 
                popis=location_config["popis"]
            )
            db.add(location)
            db.flush()  # Získání ID
            
            # Vytvoření regálů pro tuto lokaci
            for regal_config in location_config["regaly"]:
                regal = Shelf(
                    location_id=location.id,
                    nazev=regal_config["nazev"],
                    radky=regal_config["radky"],
                    sloupce=regal_config["sloupce"],
                    typ=regal_config["typ"]
                )
                db.add(regal)
                db.flush()  # Získání ID
                
                # Vytvoření pozic pro tento regál
                for radek in range(1, regal.radky + 1):
                    for sloupec in range(1, regal.sloupce + 1):
                        pozice = Position(
                            shelf_id=regal.id,
                            radek=radek,
                            sloupec=sloupec,
                            status="volna"
                        )
                        db.add(pozice)
                        pozice_celkem += 1
        
        db.commit()
        
        print(f"✅ Databáze inicializována podle konfigurace!")
        print(f"📍 Lokace: {len(ACTIVE_CONFIG['locations'])}")
        print(f"📚 Regály: {sum(len(loc['regaly']) for loc in ACTIVE_CONFIG['locations'])}")
        print(f"📦 Pozice: {pozice_celkem}")
        print(f"🔢 Čísla GB: 1-{pozice_celkem}")
        
    except Exception as e:
        print(f"❌ Chyba při inicializaci databáze: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def get_storage_statistics():
    """
    Vrací základní statistiky skladu
    """
    db = SessionLocal()
    try:
        from .models import Location, Shelf, Position, Gitterbox
        
        stats = {
            "lokace_celkem": db.query(Location).count(),
            "regaly_celkem": db.query(Shelf).count(),
            "pozice_celkem": db.query(Position).count(),
            "pozice_volne": db.query(Position).filter(Position.status == "volna").count(),
            "gitterboxes_aktivni": db.query(Gitterbox).filter(Gitterbox.stav == "aktivni").count()
        }
        
        stats["pozice_obsazene"] = stats["pozice_celkem"] - stats["pozice_volne"]
        stats["obsazenost_procenta"] = round(
            (stats["pozice_obsazene"] / stats["pozice_celkem"]) * 100, 1
        ) if stats["pozice_celkem"] > 0 else 0
        
        return stats
        
    finally:
        db.close()
