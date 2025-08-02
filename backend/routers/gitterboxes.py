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
        "volna_cisla": volna_cisla,  # Všechna volná čísla, ne jen prvních 20
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
    
    # Přemístění GB na novou pozici
    if update_data.position_id is not None and update_data.position_id != gb.position_id:
        # Ověř, že nová pozice existuje a je volná
        nova_pozice = db.query(Position).filter(Position.id == update_data.position_id).first()
        if not nova_pozice:
            raise HTTPException(status_code=400, detail="Nová pozice neexistuje")
        
        # Zkontroluj, že nová pozice je volná
        existujici_gb = db.query(Gitterbox).filter(
            Gitterbox.position_id == update_data.position_id,
            Gitterbox.stav == "aktivni"
        ).first()
        if existujici_gb:
            raise HTTPException(status_code=400, detail=f"Pozice je již obsazena Gitterboxem #{existujici_gb.cislo_gb}")
        
        # Uvolni současnou pozici
        stara_pozice = db.query(Position).filter(Position.id == gb.position_id).first()
        if stara_pozice:
            stara_pozice.status = "volna"
        
        # Obsaď novou pozici
        nova_pozice.status = "obsazena"
        gb.position_id = update_data.position_id
    
    db.commit()
    db.refresh(gb)
    
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

@router.get("/reports/capacity")
def get_capacity_report(db: Session = Depends(get_database)):
    """Komplexní report naplněnosti skladu a GB"""
    try:
        # Základní statistiky pozic
        volne_pozice = db.query(Position).filter(Position.status == "volna").count()
        max_pozice = get_total_positions()
        obsazene_pozice = max_pozice - volne_pozice
        
        # Statistiky GB
        aktivni_gb = db.query(Gitterbox).filter(Gitterbox.stav == "aktivni").all()
        celkem_gb = len(aktivni_gb)
        
        # Analýza naplněnosti GB
        plne_naplnene = len([gb for gb in aktivni_gb if gb.naplnenost_procenta >= 90])
        dobre_naplnene = len([gb for gb in aktivni_gb if 70 <= gb.naplnenost_procenta < 90])
        nedostatecne_naplnene = len([gb for gb in aktivni_gb if gb.naplnenost_procenta < 70])
        
        # Průměrná naplněnost
        prumerna_naplnenost = sum(gb.naplnenost_procenta for gb in aktivni_gb) / celkem_gb if celkem_gb > 0 else 0
        
        # GB s kritickými expiraci
        gb_s_kritickymi_expiracemi = len([gb for gb in aktivni_gb if gb.ma_kriticke_expirace])
        
        # Statistiky položek
        celkem_polozek = db.query(Item).filter(Item.stav == "aktivni").count()
        
        from datetime import datetime, timedelta
        today = datetime.now().date()
        expirované_položky = db.query(Item).filter(
            Item.stav == "aktivni",
            Item.sledovat_expiraci == True,
            Item.expiracni_datum < today
        ).count()
        
        kriticky_datum = today + timedelta(days=30)
        blizko_expirace = db.query(Item).filter(
            Item.stav == "aktivni",
            Item.sledovat_expiraci == True,
            Item.expiracni_datum >= today,
            Item.expiracni_datum <= kriticky_datum
        ).count()
        
        # Top 5 nejméně naplněných GB
        nejmen_naplnene = sorted(aktivni_gb, key=lambda x: x.naplnenost_procenta)[:5]
        top_nejmen_naplnene = []
        for gb in nejmen_naplnene:
            top_nejmen_naplnene.append({
                "cislo_gb": gb.cislo_gb,
                "naplnenost_procenta": gb.naplnenost_procenta,
                "pocet_polozek": gb.pocet_polozek,
                "zodpovedna_osoba": gb.zodpovedna_osoba,
                "lokace": gb.pozice.regal.lokace.nazev,
                "regal": gb.pozice.regal.nazev,
                "pozice": f"{gb.pozice.radek}-{gb.pozice.sloupec}"
            })
        
        return {
            "status": "success",
            "data": {
                "pozice": {
                    "celkem": max_pozice,
                    "obsazene": obsazene_pozice,
                    "volne": volne_pozice,
                    "obsazenost_procenta": round(obsazene_pozice / max_pozice * 100, 1)
                },
                "gitterboxy": {
                    "celkem_aktivnich": celkem_gb,
                    "prumerna_naplnenost": round(prumerna_naplnenost, 1),
                    "plne_naplnene": plne_naplnene,  # >= 90%
                    "dobre_naplnene": dobre_naplnene,  # 70-89%
                    "nedostatecne_naplnene": nedostatecne_naplnene,  # < 70%
                    "s_kritickymi_expiracemi": gb_s_kritickymi_expiracemi
                },
                "polozky": {
                    "celkem_aktivnich": celkem_polozek,
                    "expirovane": expirované_položky,
                    "blizko_expirace": blizko_expirace,  # do 30 dní
                    "procento_problematickych": round((expirované_položky + blizko_expirace) / celkem_polozek * 100, 1) if celkem_polozek > 0 else 0
                },
                "doporuceni": {
                    "top_nejmen_naplnene_gb": top_nejmen_naplnene,
                    "akce_potrebne": gb_s_kritickymi_expiracemi > 0 or expirované_položky > 0,
                    "priorita_expiraci": expirované_položky + blizko_expirace,
                    "optimalizace_kapacity": nedostatecne_naplnene
                }
            },
            "message": f"Report pro {celkem_gb} aktivních GB a {celkem_polozek} položek"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při generování reportu: {str(e)}")

@router.get("/reports/dashboard")
def get_dashboard_stats(db: Session = Depends(get_database)):
    """Rychlé statistiky pro dashboard"""
    try:
        from datetime import datetime, timedelta
        
        # Základní čísla
        aktivni_gb = db.query(Gitterbox).filter(Gitterbox.stav == "aktivni").count()
        celkem_polozek = db.query(Item).filter(Item.stav == "aktivni").count()
        
        # Kritické stavy
        today = datetime.now().date()
        kriticky_datum = today + timedelta(days=30)
        
        gb_s_kritickymi_expiracemi = db.query(Gitterbox).filter(
            Gitterbox.stav == "aktivni"
        ).all()
        
        kriticke_gb = len([gb for gb in gb_s_kritickymi_expiracemi if gb.ma_kriticke_expirace])
        
        nedostatecne_naplnene_gb = len([gb for gb in gb_s_kritickymi_expiracemi if gb.naplnenost_procenta < 70])
        
        # Expirace
        expirované_položky = db.query(Item).filter(
            Item.stav == "aktivni",
            Item.sledovat_expiraci == True,
            Item.expiracni_datum < today
        ).count()
        
        blizko_expirace = db.query(Item).filter(
            Item.stav == "aktivni",
            Item.sledovat_expiraci == True,
            Item.expiracni_datum >= today,
            Item.expiracni_datum <= kriticky_datum
        ).count()
        
        # Kapacita skladu
        volne_pozice = db.query(Position).filter(Position.status == "volna").count()
        max_pozice = get_total_positions()
        
        # Health score
        def calculate_health_score():
            if aktivni_gb == 0 or celkem_polozek == 0:
                return 100
            
            score = 100
            if kriticke_gb > 0:
                score -= min(30, (kriticke_gb / aktivni_gb) * 100)
            if nedostatecne_naplnene_gb > 0:
                score -= min(20, (nedostatecne_naplnene_gb / aktivni_gb) * 50)
            if expirované_položky > 0:
                score -= min(25, (expirované_položky / celkem_polozek) * 100)
            if blizko_expirace > 0:
                score -= min(15, (blizko_expirace / celkem_polozek) * 50)
            
            return max(0, round(score, 1))
        
        return {
            "status": "success",
            "data": {
                "aktivni_gb": aktivni_gb,
                "celkem_polozek": celkem_polozek,
                "kriticke_gb": kriticke_gb,
                "nedostatecne_naplnene_gb": nedostatecne_naplnene_gb,
                "expirovane_polozky": expirované_položky,
                "blizko_expirace": blizko_expirace,
                "volne_pozice": volne_pozice,
                "obsazenost_skladu_procenta": round((max_pozice - volne_pozice) / max_pozice * 100, 1),
                "celkovy_health_score": calculate_health_score()
            },
            "message": "Dashboard statistiky načteny"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání dashboard statistik: {str(e)}")
