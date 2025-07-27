"""
Router pro správu pozic (positions)
Autor: GitHub Copilot
Datum: 27.7.2025
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_database
from models import Position, Shelf, Location

router = APIRouter(prefix="/api/positions", tags=["positions"])

@router.get("/")
async def get_all_positions(db: Session = Depends(get_database)):
    """Získání všech pozic se základními informacemi"""
    try:
        positions = db.query(Position).all()
        
        result = []
        for pos in positions:
            result.append({
                "id": pos.id,
                "shelf_id": pos.shelf_id,
                "radek": pos.radek,
                "sloupec": pos.sloupec,
                "nazev_pozice": pos.nazev_pozice,
                "status": pos.status,
                "shelf": {
                    "id": pos.shelf.id,
                    "nazev": pos.shelf.nazev,
                    "location": {
                        "id": pos.shelf.location.id,
                        "nazev": pos.shelf.location.nazev
                    }
                } if pos.shelf else None,
                "je_obsazena": pos.gitterbox is not None,
                "gitterbox_cislo": pos.gitterbox.cislo_gb if pos.gitterbox else None
            })
        
        return {
            "status": "success",
            "data": result,
            "message": f"Načteno {len(result)} pozic"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání pozic: {str(e)}")

@router.get("/available")
async def get_available_positions(db: Session = Depends(get_database)):
    """Získání všech dostupných (volných) pozic pro nový Gitterbox"""
    try:
        # Najdi pozice, které nemají přiřazený GB
        positions = db.query(Position).filter(
            Position.status == "volna"
        ).all()
        
        # Filtruj jen ty, které skutečně nemají GB
        available_positions = [pos for pos in positions if not pos.gitterbox]
        
        result = []
        for pos in available_positions:
            result.append({
                "id": pos.id,
                "shelf_id": pos.shelf_id,
                "radek": pos.radek,
                "sloupec": pos.sloupec,
                "nazev_pozice": pos.nazev_pozice,
                "shelf": {
                    "id": pos.shelf.id,
                    "nazev": pos.shelf.nazev,
                    "radky": pos.shelf.radky,
                    "sloupce": pos.shelf.sloupce,
                    "location": {
                        "id": pos.shelf.location.id,
                        "nazev": pos.shelf.location.nazev
                    }
                } if pos.shelf else None
            })
        
        # Seřaď podle lokace, regálu a pozice
        result.sort(key=lambda x: (
            x['shelf']['location']['nazev'] if x['shelf'] else '',
            x['shelf']['nazev'] if x['shelf'] else '',
            x['radek'],
            x['sloupec']
        ))
        
        return {
            "status": "success",
            "data": result,
            "message": f"Nalezeno {len(result)} dostupných pozic"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání dostupných pozic: {str(e)}")

@router.get("/{position_id}")
async def get_position(position_id: int, db: Session = Depends(get_database)):
    """Získání konkrétní pozice s detaily"""
    try:
        position = db.query(Position).filter(Position.id == position_id).first()
        if not position:
            raise HTTPException(status_code=404, detail="Pozice nebyla nalezena")
        
        result = {
            "id": position.id,
            "shelf_id": position.shelf_id,
            "radek": position.radek,
            "sloupec": position.sloupec,
            "nazev_pozice": position.nazev_pozice,
            "status": position.status,
            "shelf": {
                "id": position.shelf.id,
                "nazev": position.shelf.nazev,
                "radky": position.shelf.radky,
                "sloupce": position.shelf.sloupce,
                "typ": position.shelf.typ,
                "location": {
                    "id": position.shelf.location.id,
                    "nazev": position.shelf.location.nazev,
                    "popis": position.shelf.location.popis
                }
            } if position.shelf else None,
            "gitterbox": None
        }
        
        # Pokud je pozice obsazená, přidej info o GB
        if position.gitterbox:
            gb = position.gitterbox
            result["gitterbox"] = {
                "id": gb.id,
                "cislo_gb": gb.cislo_gb,
                "zodpovedna_osoba": gb.zodpovedna_osoba,
                "datum_zalozeni": gb.datum_zalozeni.isoformat(),
                "naplnenost_procenta": gb.naplnenost_procenta,
                "pocet_polozek": gb.pocet_polozek,
                "stav": gb.stav,
                "poznamka": gb.poznamka
            }
        
        return {
            "status": "success",
            "data": result,
            "message": "Pozice úspěšně načtena"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání pozice: {str(e)}")
