"""
Router pro správu regálů (shelves)
Autor: GitHub Copilot
Datum: 27.7.2025
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import Optional

from database import get_database
from models import Shelf, Position, Location

router = APIRouter(prefix="/api/shelves", tags=["shelves"])

class ShelfUpdateRequest(BaseModel):
    nazev: Optional[str] = None
    radky: Optional[int] = None
    sloupce: Optional[int] = None
    typ: Optional[str] = None
    
    @validator('radky')
    def validate_radky(cls, v):
        if v is not None and (v < 1 or v > 20):
            raise ValueError('Počet řádků musí být mezi 1 a 20')
        return v
    
    @validator('sloupce')
    def validate_sloupce(cls, v):
        if v is not None and (v < 1 or v > 20):
            raise ValueError('Počet sloupců musí být mezi 1 a 20')
        return v
    
    @validator('typ')
    def validate_typ(cls, v):
        if v is not None and v not in ['standardni', 'velky', 'maly', 'specialni']:
            raise ValueError('Neplatný typ regálu')
        return v

class ShelfCreateRequest(BaseModel):
    location_id: int
    nazev: str
    radky: int
    sloupce: int
    typ: str = "standardni"
    
    @validator('radky')
    def validate_radky(cls, v):
        if v < 1 or v > 20:
            raise ValueError('Počet řádků musí být mezi 1 a 20')
        return v
    
    @validator('sloupce')
    def validate_sloupce(cls, v):
        if v < 1 or v > 20:
            raise ValueError('Počet sloupců musí být mezi 1 a 20')
        return v
    
    @validator('typ')
    def validate_typ(cls, v):
        if v not in ['standardni', 'velky', 'maly', 'specialni']:
            raise ValueError('Neplatný typ regálu')
        return v

@router.get("/")
async def get_all_shelves(db: Session = Depends(get_database)):
    """Získání všech regálů s detaily"""
    try:
        shelves = db.query(Shelf).all()
        
        result = []
        for shelf in shelves:
            # Spočítej pozice
            total_positions = db.query(Position).filter(Position.shelf_id == shelf.id).count()
            occupied_positions = db.query(Position).filter(
                Position.shelf_id == shelf.id, 
                Position.status == "obsazena"
            ).count()
            
            result.append({
                "id": shelf.id,
                "nazev": shelf.nazev,
                "radky": shelf.radky,
                "sloupce": shelf.sloupce,
                "typ": shelf.typ,
                "location": {
                    "id": shelf.lokace.id,
                    "nazev": shelf.lokace.nazev,
                    "popis": shelf.lokace.popis
                } if shelf.lokace else None,
                "statistics": {
                    "total_positions": total_positions,
                    "occupied_positions": occupied_positions,
                    "occupancy_percentage": round((occupied_positions / total_positions * 100) if total_positions > 0 else 0, 1)
                }
            })
        
        return {
            "status": "success",
            "data": result,
            "message": f"Načteno {len(result)} regálů"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání regálů: {str(e)}")

@router.get("/{shelf_id}")
async def get_shelf(shelf_id: int, db: Session = Depends(get_database)):
    """Získání konkrétního regálu s detaily"""
    try:
        shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
        if not shelf:
            raise HTTPException(status_code=404, detail="Regál nebyl nalezen")
        
        # Spočítej pozice a gitterboxy
        total_positions = db.query(Position).filter(Position.shelf_id == shelf.id).count()
        occupied_positions = db.query(Position).filter(
            Position.shelf_id == shelf.id,
            Position.status == "obsazena"
        ).count()
        
        result = {
            "id": shelf.id,
            "nazev": shelf.nazev,
            "radky": shelf.radky,
            "sloupce": shelf.sloupce,
            "typ": shelf.typ,
            "location": {
                "id": shelf.lokace.id,
                "nazev": shelf.lokace.nazev,
                "popis": shelf.lokace.popis
            } if shelf.lokace else None,
            "statistics": {
                "total_positions": total_positions,
                "occupied_positions": occupied_positions,
                "free_positions": total_positions - occupied_positions,
                "occupancy_percentage": round((occupied_positions / total_positions * 100) if total_positions > 0 else 0, 1)
            }
        }
        
        return {
            "status": "success",
            "data": result,
            "message": "Regál úspěšně načten"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání regálu: {str(e)}")

@router.put("/{shelf_id}")
async def update_shelf(shelf_id: int, request: ShelfUpdateRequest, db: Session = Depends(get_database)):
    """Úprava regálu - změna názvu nebo velikosti"""
    try:
        shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
        if not shelf:
            raise HTTPException(status_code=404, detail="Regál nebyl nalezen")
        
        # Kontrola, jestli regál neobsahuje gitterboxy při změně velikosti
        if (request.radky is not None or request.sloupce is not None):
            occupied_positions = db.query(Position).filter(
                Position.shelf_id == shelf.id,
                Position.status == "obsazena"
            ).count()
            
            if occupied_positions > 0:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Nelze měnit velikost regálu s {occupied_positions} obsazenými pozicemi. Nejprve přesuňte nebo archivujte všechny Gitterboxy."
                )
        
        # Uložit původní hodnoty
        old_radky = shelf.radky
        old_sloupce = shelf.sloupce
        
        # Aktualizace hodnot
        if request.nazev is not None:
            shelf.nazev = request.nazev
        if request.typ is not None:
            shelf.typ = request.typ
        if request.radky is not None:
            shelf.radky = request.radky
        if request.sloupce is not None:
            shelf.sloupce = request.sloupce
            
        db.commit()
        
        # Pokud se změnila velikost, přegeneruj pozice
        if (request.radky is not None and request.radky != old_radky) or \
           (request.sloupce is not None and request.sloupce != old_sloupce):
            await _regenerate_positions(shelf, db)
            
        return {
            "status": "success",
            "message": "Regál úspěšně aktualizován",
            "data": {
                "id": shelf.id,
                "nazev": shelf.nazev,
                "radky": shelf.radky,
                "sloupce": shelf.sloupce,
                "typ": shelf.typ,
                "positions_regenerated": request.radky is not None or request.sloupce is not None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chyba při aktualizaci regálu: {str(e)}")

@router.post("/")
async def create_shelf(request: ShelfCreateRequest, db: Session = Depends(get_database)):
    """Vytvoření nového regálu"""
    try:
        # Kontrola existence lokace
        location = db.query(Location).filter(Location.id == request.location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Lokace nebyla nalezena")
        
        # Vytvoř nový regál
        shelf = Shelf(
            location_id=request.location_id,
            nazev=request.nazev,
            radky=request.radky,
            sloupce=request.sloupce,
            typ=request.typ
        )
        
        db.add(shelf)
        db.commit()
        db.refresh(shelf)
        
        # Vygeneruj pozice pro nový regál
        await _regenerate_positions(shelf, db)
        
        return {
            "status": "success",
            "message": "Regál úspěšně vytvořen",
            "data": {
                "id": shelf.id,
                "nazev": shelf.nazev,
                "radky": shelf.radky,
                "sloupce": shelf.sloupce,
                "typ": shelf.typ,
                "total_positions": shelf.radky * shelf.sloupce
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chyba při vytváření regálu: {str(e)}")

@router.delete("/{shelf_id}")
async def delete_shelf(shelf_id: int, db: Session = Depends(get_database)):
    """Smazání regálu (pouze pokud je prázdný)"""
    try:
        shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
        if not shelf:
            raise HTTPException(status_code=404, detail="Regál nebyl nalezen")
        
        # Kontrola obsazenosti
        occupied_positions = db.query(Position).filter(
            Position.shelf_id == shelf.id,
            Position.status == "obsazena"
        ).count()
        
        if occupied_positions > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Nelze smazat regál s {occupied_positions} obsazenými pozicemi. Nejprve přesuňte nebo archivujte všechny Gitterboxy."
            )
        
        # Smaž všechny pozice regálu
        db.query(Position).filter(Position.shelf_id == shelf.id).delete()
        
        # Smaž regál
        db.delete(shelf)
        db.commit()
        
        return {
            "status": "success",
            "message": f"Regál '{shelf.nazev}' byl úspěšně smazán"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chyba při mazání regálu: {str(e)}")

async def _regenerate_positions(shelf: Shelf, db: Session):
    """Přegenerování pozic regálu po změně velikosti"""
    # Smaž VŠECHNY stávající pozice regálu (volné i obsazené pozice už byly zkontrolovány dříve)
    db.query(Position).filter(Position.shelf_id == shelf.id).delete()
    
    # Vygeneruj nové pozice podle nové velikosti
    for radek in range(1, shelf.radky + 1):
        for sloupec in range(1, shelf.sloupce + 1):
            position = Position(
                shelf_id=shelf.id,
                radek=radek,
                sloupec=sloupec,
                status="volna"
            )
            db.add(position)
    
    db.commit()
