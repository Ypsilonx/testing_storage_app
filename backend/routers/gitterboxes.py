"""
API Router pro správu Gitterboxů
Autor: GitHub Copilot  
Datum: 27.7.2025

Funkce:
- Vytvoření nového GB s globálním číslováním
- Získání detailu GB s pozicí a položkami  
- Úprava GB (zodpovědná osoba, poznámka, stav)
- Seznam všech GB s filtrováním
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from datetime import date

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_database
from models import Gitterbox, Position, Shelf, Location, Item
from storage_config import get_total_positions

router = APIRouter(prefix="/api/gitterboxes", tags=["gitterboxes"])

# Pydantic modely pro API
from pydantic import BaseModel

class GitterboxCreate(BaseModel):
    cislo_gb: int  # Uživatel si vybere číslo GB
    zodpovedna_osoba: str
    position_id: int
    naplnenost_procenta: Optional[int] = 0
    poznamka: Optional[str] = None

class GitterboxUpdate(BaseModel):
    zodpovedna_osoba: Optional[str] = None
    position_id: Optional[int] = None  # Umožní přemístění GB
    naplnenost_procenta: Optional[int] = None
    stav: Optional[str] = None
    poznamka: Optional[str] = None

class GitterboxResponse(BaseModel):
    id: int
    cislo_gb: int
    zodpovedna_osoba: str
    datum_zalozeni: date
    naplnenost_procenta: int
    stav: str
    poznamka: Optional[str]
    
    # Informace o pozici
    position_id: int
    lokace: str
    regal: str
    radek: int
    sloupec: int
    
    # Statistiky
    pocet_polozek: int
    ma_kriticke_expirace: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=Dict[str, Any])
def get_all_gitterboxes(
    stav: Optional[str] = None,
    zodpovedna_osoba: Optional[str] = None,
    db: Session = Depends(get_database)
):
    """Získá seznam všech Gitterboxů s možností filtrování"""
    
    query = db.query(Gitterbox).join(Position).join(Shelf).join(Location)
    
    if stav:
        query = query.filter(Gitterbox.stav == stav)
    if zodpovedna_osoba:
        query = query.filter(Gitterbox.zodpovedna_osoba.ilike(f"%{zodpovedna_osoba}%"))
    
    gitterboxes = query.order_by(Gitterbox.cislo_gb).all()
    
    result = []
    for gb in gitterboxes:
        # Spočítáme položky a kontrolujeme expirace
        items = db.query(Item).filter(Item.gitterbox_id == gb.id, Item.stav == "aktivni").all()
        
        # Zkontrolujeme kritické expirace (méně než 30 dní)
        from datetime import datetime, timedelta
        kriticky_datum = datetime.now().date() + timedelta(days=30)
        ma_kriticke = any(
            item.sledovat_expiraci and 
            item.expiracni_datum and 
            item.expiracni_datum <= kriticky_datum 
            for item in items
        )
        
        result.append(GitterboxResponse(
            id=gb.id,
            cislo_gb=gb.cislo_gb,
            zodpovedna_osoba=gb.zodpovedna_osoba,
            datum_zalozeni=gb.datum_zalozeni,
            naplnenost_procenta=gb.naplnenost_procenta,
            stav=gb.stav,
            poznamka=gb.poznamka,
            position_id=gb.position_id,
            lokace=gb.pozice.regal.lokace.nazev,
            regal=gb.pozice.regal.nazev,
            radek=gb.pozice.radek,
            sloupec=gb.pozice.sloupec,
            pocet_polozek=len(items),
            ma_kriticke_expirace=ma_kriticke
        ))
    
    return {
        "status": "success",
        "data": result,
        "message": f"Načteno {len(result)} Gitterboxů"
    }


@router.get("/available-numbers")
def get_available_gb_numbers(db: Session = Depends(get_database)):
    """Vrátí seznam volných čísel GB"""
    
    max_cislo = get_total_positions()
    
    # Získáme všechna obsazená čísla
    obsazena_cisla = set(
        result[0] for result in 
        db.query(Gitterbox.cislo_gb).filter(Gitterbox.stav == "aktivni").all()
    )
    
    # Najdeme volná čísla
    volna_cisla = [cislo for cislo in range(1, max_cislo + 1) if cislo not in obsazena_cisla]
    
    return {
        "volna_cisla": volna_cisla[:20],  # Prvních 20 pro dropdown
        "celkem_volnych": len(volna_cisla),
        "celkem_obsazenych": len(obsazena_cisla),
        "max_cislo": max_cislo
    }


@router.get("/{gb_id}", response_model=GitterboxResponse)
def get_gitterbox(gb_id: int, db: Session = Depends(get_database)):
    """Získá detail konkrétního Gitterboxu"""
    
    gb = db.query(Gitterbox).filter(Gitterbox.id == gb_id).first()
    if not gb:
        raise HTTPException(status_code=404, detail="Gitterbox nenalezen")
    
    # Spočítáme položky a kontrolujeme expirace
    items = db.query(Item).filter(Item.gitterbox_id == gb.id, Item.stav == "aktivni").all()
    
    # Zkontrolujeme kritické expirace (méně než 30 dní)
    from datetime import datetime, timedelta
    kriticky_datum = datetime.now().date() + timedelta(days=30)
    ma_kriticke = any(
        item.sledovat_expiraci and 
        item.expiracni_datum and 
        item.expiracni_datum <= kriticky_datum 
        for item in items
    )
    
    return GitterboxResponse(
        id=gb.id,
        cislo_gb=gb.cislo_gb,
        zodpovedna_osoba=gb.zodpovedna_osoba,
        datum_zalozeni=gb.datum_zalozeni,
        naplnenost_procenta=gb.naplnenost_procenta,
        stav=gb.stav,
        poznamka=gb.poznamka,
        position_id=gb.position_id,
        lokace=gb.pozice.regal.lokace.nazev,
        regal=gb.pozice.regal.nazev,
        radek=gb.pozice.radek,
        sloupec=gb.pozice.sloupec,
        pocet_polozek=len(items),
        ma_kriticke_expirace=ma_kriticke
    )

@router.get("/by-number/{cislo_gb}", response_model=GitterboxResponse)
def get_gitterbox_by_number(cislo_gb: int, db: Session = Depends(get_database)):
    """Získá Gitterbox podle globálního čísla GB"""
    
    gb = db.query(Gitterbox).filter(Gitterbox.cislo_gb == cislo_gb).first()
    if not gb:
        raise HTTPException(status_code=404, detail=f"Gitterbox s číslem {cislo_gb} nenalezen")
    
    return get_gitterbox(gb.id, db)

@router.post("/", response_model=GitterboxResponse)
def create_gitterbox(gitterbox_data: GitterboxCreate, db: Session = Depends(get_database)):
    """Vytvoří nový Gitterbox na zadané pozici s automatickým přidělením čísla"""
    
    # 1. Ověříme že pozice existuje a je volná
    pozice = db.query(Position).filter(Position.id == gitterbox_data.position_id).first()
    if not pozice:
        raise HTTPException(status_code=404, detail="Pozice nebyla nalezena")
    
    if pozice.status != "volna":
        raise HTTPException(status_code=400, detail="Pozice není volná")
    
    # Zkontrolujeme zda na pozici už není GB
    existing_gb = db.query(Gitterbox).filter(
        Gitterbox.position_id == gitterbox_data.position_id,
        Gitterbox.stav == "aktivni"
    ).first()
    if existing_gb:
        raise HTTPException(status_code=400, detail=f"Na pozici už je GB #{existing_gb.cislo_gb}")
    
    # 2. Zkontrolujeme dostupnost čísla GB
    if gitterbox_data.cislo_gb < 1:
        raise HTTPException(status_code=422, detail="Číslo GB musí být alespoň 1")
    
    max_cislo = get_total_positions()  # Maximum podle konfigurace
    if gitterbox_data.cislo_gb > max_cislo:
        raise HTTPException(status_code=422, detail=f"Číslo GB nesmí být větší než {max_cislo}")
    
    # Zkontrolujeme zda číslo GB už není použité
    existing_gb_by_number = db.query(Gitterbox).filter(
        Gitterbox.cislo_gb == gitterbox_data.cislo_gb,
        Gitterbox.stav == "aktivni"
    ).first()
    if existing_gb_by_number:
        raise HTTPException(status_code=400, detail=f"Číslo GB #{gitterbox_data.cislo_gb} už je obsazené")

    # 3. Vytvoříme nový Gitterbox
    new_gb = Gitterbox(
        cislo_gb=gitterbox_data.cislo_gb,  # Použijeme číslo z uživatelského vstupu
        position_id=gitterbox_data.position_id,
        zodpovedna_osoba=gitterbox_data.zodpovedna_osoba,
        naplnenost_procenta=gitterbox_data.naplnenost_procenta or 0,
        poznamka=gitterbox_data.poznamka,
        datum_zalozeni=date.today(),
        stav="aktivni"
    )
    
    # 4. Označíme pozici jako obsazenou
    pozice.status = "obsazena"
    
    # 5. Uložíme do databáze
    db.add(new_gb)
    db.commit()
    db.refresh(new_gb)
    
    print(f"✅ Vytvořen nový Gitterbox #{gitterbox_data.cislo_gb} na pozici {pozice.radek}-{pozice.sloupec} pro {gitterbox_data.zodpovedna_osoba}")
    
    return get_gitterbox(new_gb.id, db)

@router.put("/{gb_id}", response_model=GitterboxResponse)
def update_gitterbox(gb_id: int, update_data: GitterboxUpdate, db: Session = Depends(get_database)):
    """Aktualizuje existující Gitterbox"""
    
    gb = db.query(Gitterbox).filter(Gitterbox.id == gb_id).first()
    if not gb:
        raise HTTPException(status_code=404, detail="Gitterbox nenalezen")
    
    # Aktualizujeme pouze poskytnutá pole
    if update_data.zodpovedna_osoba is not None:
        gb.zodpovedna_osoba = update_data.zodpovedna_osoba
    if update_data.naplnenost_procenta is not None:
        gb.naplnenost_procenta = max(0, min(100, update_data.naplnenost_procenta))
    if update_data.stav is not None:
        gb.stav = update_data.stav
    if update_data.poznamka is not None:
        gb.poznamka = update_data.poznamka
    
    db.commit()
    db.refresh(gb)
    
    print(f"✅ Gitterbox #{gb.cislo_gb} aktualizován")
    
    return get_gitterbox(gb.id, db)

@router.delete("/{gb_id}")
def delete_gitterbox(gb_id: int, db: Session = Depends(get_database)):
    """Označí Gitterbox jako neaktivní a uvolní pozici"""
    
    gb = db.query(Gitterbox).filter(Gitterbox.id == gb_id).first()
    if not gb:
        raise HTTPException(status_code=404, detail="Gitterbox nenalezen")
    
    # Označíme GB jako neaktivní místo mazání
    gb.stav = "neaktivni"
    
    # Uvolníme pozici
    pozice = db.query(Position).filter(Position.id == gb.position_id).first()
    if pozice:
        pozice.status = "volna"
    
    # Označíme všechny položky jako neaktivní
    db.query(Item).filter(Item.gitterbox_id == gb.id).update({"stav": "neaktivni"})
    
    db.commit()
    
    print(f"✅ Gitterbox #{gb.cislo_gb} označen jako neaktivní a pozice uvolněna")
    
    return {"message": f"Gitterbox #{gb.cislo_gb} byl úspěšně odstraněn"}

@router.get("/free-positions/count")
def get_free_positions_count(db: Session = Depends(get_database)):
    """Vrátí počet volných pozic ve skladu"""
    
    volne_pozice = db.query(Position).filter(Position.status == "volna").count()
    max_pozice = get_total_positions()
    
    return {
        "volne_pozice": volne_pozice,
        "celkem_pozic": max_pozice,
        "obsazene_pozice": max_pozice - volne_pozice,
        "obsazenost_procenta": round((max_pozice - volne_pozice) / max_pozice * 100, 1)
    }
