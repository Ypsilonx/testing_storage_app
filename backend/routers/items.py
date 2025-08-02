"""
Router pro správu položek (items)
Autor: GitHub Copilot
Datum: 27.7.2025
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime, timedelta

from database import get_database
from models import Item, Gitterbox

router = APIRouter(prefix="/api/items", tags=["items"])

# Pydantic modely pro request/response
class ItemCreate(BaseModel):
    gitterbox_id: int
    tma_cislo: Optional[str] = None
    projekt: Optional[str] = None
    nazev_dilu: str
    pocet_kusu: int = 1
    jednotka: str = "ks"
    sledovat_expiraci: bool = True
    expiracni_datum: Optional[date] = None
    poznamka: Optional[str] = None

class ItemUpdate(BaseModel):
    tma_cislo: Optional[str] = None
    projekt: Optional[str] = None
    nazev_dilu: Optional[str] = None
    pocet_kusu: Optional[int] = None
    jednotka: Optional[str] = None
    sledovat_expiraci: Optional[bool] = None
    expiracni_datum: Optional[date] = None
    poznamka: Optional[str] = None
    stav: Optional[str] = None

@router.post("/")
async def create_item(item_data: ItemCreate, db: Session = Depends(get_database)):
    """Vytvoření nové položky"""
    try:
        # Ověř že Gitterbox existuje
        gitterbox = db.query(Gitterbox).filter(Gitterbox.id == item_data.gitterbox_id).first()
        if not gitterbox:
            raise HTTPException(status_code=404, detail="Gitterbox nebyl nalezen")
        
        # Automatické nastavení expiračního data
        expiracni_datum = item_data.expiracni_datum
        if item_data.sledovat_expiraci and not expiracni_datum:
            # Automaticky za 1 rok
            expiracni_datum = date.today() + timedelta(days=365)
        
        # Vytvoř novou položku
        new_item = Item(
            gitterbox_id=item_data.gitterbox_id,
            tma_cislo=item_data.tma_cislo,
            projekt=item_data.projekt,
            nazev_dilu=item_data.nazev_dilu,
            pocet_kusu=item_data.pocet_kusu,
            jednotka=item_data.jednotka,
            sledovat_expiraci=item_data.sledovat_expiraci,
            expiracni_datum=expiracni_datum,
            poznamka=item_data.poznamka
        )
        
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        
        return {
            "status": "success",
            "data": {
                "id": new_item.id,
                "nazev_dilu": new_item.nazev_dilu,
                "gitterbox_id": new_item.gitterbox_id,
                "pocet_kusu": new_item.pocet_kusu,
                "jednotka": new_item.jednotka,
                "popis_mnozstvi": new_item.popis_mnozstvi,
                "datum_zaskladneni": new_item.datum_zaskladneni.isoformat(),
                "expiracni_datum": new_item.expiracni_datum.isoformat() if new_item.expiracni_datum else None,
                "sledovat_expiraci": new_item.sledovat_expiraci
            },
            "message": f"Položka '{item_data.nazev_dilu}' byla úspěšně vytvořena"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chyba při vytváření položky: {str(e)}")

@router.get("/expired")
async def get_expired_items(db: Session = Depends(get_database)):
    """Získání všech expirovaných položek"""
    try:
        today = date.today()
        
        # Najdeme všechny položky které už expirovali
        expired_items = db.query(Item).filter(
            Item.stav == "aktivni",
            Item.sledovat_expiraci == True,
            Item.expiracni_datum < today
        ).all()
        
        result = []
        for item in expired_items:
            # Informace o GB
            gb_info = {
                "cislo_gb": item.gitterbox.cislo_gb,
                "zodpovedna_osoba": item.gitterbox.zodpovedna_osoba,
                "lokace": item.gitterbox.pozice.regal.lokace.nazev,
                "regal": item.gitterbox.pozice.regal.nazev,
                "pozice": f"{item.gitterbox.pozice.radek}-{item.gitterbox.pozice.sloupec}"
            }
            
            result.append({
                "id": item.id,
                "nazev_dilu": item.nazev_dilu,
                "tma_cislo": item.tma_cislo,
                "projekt": item.projekt,
                "popis_mnozstvi": item.popis_mnozstvi,
                "expiracni_datum": item.expiracni_datum.isoformat(),
                "dny_po_expiraci": (today - item.expiracni_datum).days,
                "gitterbox": gb_info
            })
        
        return {
            "status": "success",
            "data": result,
            "message": f"Nalezeno {len(result)} expirovaných položek",
            "pocet_expirovaných": len(result)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání expirovaných položek: {str(e)}")

@router.get("/expiring-soon")
async def get_expiring_soon_items(days_ahead: int = 30, db: Session = Depends(get_database)):
    """Získání položek blízko expirace (default 30 dní)"""
    try:
        today = date.today()
        target_date = today + timedelta(days=days_ahead)
        
        # Najdeme položky které expirují v následujících X dnech
        expiring_items = db.query(Item).filter(
            Item.stav == "aktivni",
            Item.sledovat_expiraci == True,
            Item.expiracni_datum >= today,  # Ještě neexpirované
            Item.expiracni_datum <= target_date  # Ale blízko expirace
        ).all()
        
        result = []
        for item in expiring_items:
            # Informace o GB
            gb_info = {
                "cislo_gb": item.gitterbox.cislo_gb,
                "zodpovedna_osoba": item.gitterbox.zodpovedna_osoba,
                "lokace": item.gitterbox.pozice.regal.lokace.nazev,
                "regal": item.gitterbox.pozice.regal.nazev,
                "pozice": f"{item.gitterbox.pozice.radek}-{item.gitterbox.pozice.sloupec}"
            }
            
            result.append({
                "id": item.id,
                "nazev_dilu": item.nazev_dilu,
                "tma_cislo": item.tma_cislo,
                "projekt": item.projekt,
                "popis_mnozstvi": item.popis_mnozstvi,
                "expiracni_datum": item.expiracni_datum.isoformat(),
                "dny_do_expirace": item.dny_do_expirace,
                "priorita": "kritická" if item.dny_do_expirace <= 7 else "vysoká" if item.dny_do_expirace <= 14 else "střední",
                "gitterbox": gb_info
            })
        
        # Seřadíme podle priority (nejkritičtější první)
        result.sort(key=lambda x: x["dny_do_expirace"])
        
        return {
            "status": "success",
            "data": result,
            "message": f"Nalezeno {len(result)} položek blízko expirace (do {days_ahead} dní)",
            "pocet_blizko_expirace": len(result),
            "kriticke": len([x for x in result if x["priorita"] == "kritická"]),
            "vysoke": len([x for x in result if x["priorita"] == "vysoká"]),
            "stredni": len([x for x in result if x["priorita"] == "střední"])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání položek blízko expirace: {str(e)}")

@router.post("/batch-expire")
async def batch_expire_items(item_ids: list[int], db: Session = Depends(get_database)):
    """Batch označení položek jako expirované"""
    try:
        if not item_ids:
            raise HTTPException(status_code=400, detail="Seznam ID položek nesmí být prázdný")
        
        # Najdeme všechny položky
        items = db.query(Item).filter(Item.id.in_(item_ids)).all()
        
        if len(items) != len(item_ids):
            found_ids = [item.id for item in items]
            missing_ids = [id for id in item_ids if id not in found_ids]
            raise HTTPException(
                status_code=404, 
                detail=f"Některé položky nebyly nalezeny: {missing_ids}"
            )
        
        # Označíme jako expirované
        updated_count = 0
        for item in items:
            if item.stav == "aktivni":
                item.stav = "expirovana"
                updated_count += 1
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Označeno {updated_count} položek jako expirovaných",
            "aktualizovano": updated_count,
            "celkem_zpracovano": len(items)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chyba při batch operaci: {str(e)}")

@router.get("/{item_id}")
async def get_item(item_id: int, db: Session = Depends(get_database)):
    """Získání konkrétní položky"""
    try:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Položka nebyla nalezena")
        
        return {
            "status": "success",
            "data": {
                "id": item.id,
                "gitterbox_id": item.gitterbox_id,
                "tma_cislo": item.tma_cislo,
                "projekt": item.projekt,
                "nazev_dilu": item.nazev_dilu,
                "pocet_kusu": item.pocet_kusu,
                "jednotka": item.jednotka,
                "popis_mnozstvi": item.popis_mnozstvi,
                "datum_zaskladneni": item.datum_zaskladneni.isoformat(),
                "sledovat_expiraci": item.sledovat_expiraci,
                "expiracni_datum": item.expiracni_datum.isoformat() if item.expiracni_datum else None,
                "je_blizko_expirace": item.je_blizko_expirace,
                "dny_do_expirace": item.dny_do_expirace,
                "stav": item.stav,
                "poznamka": item.poznamka
            },
            "message": "Položka úspěšně načtena"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání položky: {str(e)}")

@router.put("/{item_id}")
async def update_item(item_id: int, item_data: ItemUpdate, db: Session = Depends(get_database)):
    """Aktualizace položky"""
    try:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Položka nebyla nalezena")
        
        # Aktualizuj jen poskytnuté fieldy
        update_data = item_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(item, field, value)
        
        # Pokud se změnilo sledování expirace
        if 'sledovat_expiraci' in update_data:
            if item_data.sledovat_expiraci and not item.expiracni_datum:
                # Nastav automatickou expiraci za 1 rok
                item.expiracni_datum = date.today() + timedelta(days=365)
            elif not item_data.sledovat_expiraci:
                # Zruš expiraci
                item.expiracni_datum = None
        
        db.commit()
        db.refresh(item)
        
        return {
            "status": "success",
            "data": {
                "id": item.id,
                "nazev_dilu": item.nazev_dilu,
                "pocet_kusu": item.pocet_kusu,
                "jednotka": item.jednotka,
                "popis_mnozstvi": item.popis_mnozstvi,
                "sledovat_expiraci": item.sledovat_expiraci,
                "expiracni_datum": item.expiracni_datum.isoformat() if item.expiracni_datum else None
            },
            "message": f"Položka '{item.nazev_dilu}' byla úspěšně aktualizována"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chyba při aktualizaci položky: {str(e)}")

@router.delete("/{item_id}")
async def delete_item(item_id: int, db: Session = Depends(get_database)):
    """Smazání položky (soft delete)"""
    try:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Položka nebyla nalezena")
        
        # Soft delete - jen změna stavu
        item.stav = "vyskaldnen"
        
        db.commit()
        
        return {
            "status": "success",
            "data": {
                "id": item.id,
                "nazev_dilu": item.nazev_dilu
            },
            "message": f"Položka '{item.nazev_dilu}' byla úspěšně vyskladněna"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chyba při mazání položky: {str(e)}")

@router.get("/")
async def get_all_items(
    gitterbox_id: Optional[int] = None, 
    status: str = "aktivni",
    db: Session = Depends(get_database)
):
    """Získání všech položek s filtrováním"""
    try:
        query = db.query(Item)
        
        # Filter podle GB
        if gitterbox_id:
            query = query.filter(Item.gitterbox_id == gitterbox_id)
        
        # Filter podle stavu
        if status:
            query = query.filter(Item.stav == status)
        
        items = query.all()
        
        result = []
        for item in items:
            result.append({
                "id": item.id,
                "gitterbox_id": item.gitterbox_id,
                "tma_cislo": item.tma_cislo,
                "projekt": item.projekt,
                "nazev_dilu": item.nazev_dilu,
                "popis_mnozstvi": item.popis_mnozstvi,
                "datum_zaskladneni": item.datum_zaskladneni.isoformat(),
                "sledovat_expiraci": item.sledovat_expiraci,
                "expiracni_datum": item.expiracni_datum.isoformat() if item.expiracni_datum else None,
                "je_blizko_expirace": item.je_blizko_expirace,
                "dny_do_expirace": item.dny_do_expirace,
                "stav": item.stav
            })
        
        return {
            "status": "success",
            "data": result,
            "message": f"Načteno {len(result)} položek"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání položek: {str(e)}")
