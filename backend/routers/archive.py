"""
API Router pro archivaci a vyskladnění
Autor: GitH        # Připrav data pro archivaci
        # Sloučení poznámek - pouze neprázdné části
        poznamky = []
        if item.poznamka and item.poznamka.strip():
            poznamky.append(item.poznamka.strip())
        if request.poznamka and request.poznamka.strip():
            poznamky.append(request.poznamka.strip())
        
        item_data = {
            'nazev_dilu': item.nazev_dilu,
            'tma_cislo': item.tma_cislo,
            'projekt': item.projekt,
            'popis_mnozstvi': item.popis_mnozstvi,
            'expiracni_datum': str(item.expiracni_datum) if item.expiracni_datum else '',
            'poznamka': ' | '.join(poznamky),
            'datum_zaskladneni': str(item.datum_zaskladneni),
            'gb_cislo': gb.cislo_gb if gb else ''
        }
Datum: 2.8.2025

Funkcionalita:
- Vyskladnění jednotlivých položek s archivací
- Vyskladnění celých GB s archivací
- Export archivních dat
- Statistiky vyskladněných položek
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import date

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_database
from models import Gitterbox, Position, Item
from services.archive_service import ArchiveService, VYSSKLADNENI_DUVODY

router = APIRouter(prefix="/api/archive", tags=["archive"])

# Pydantic modely
from pydantic import BaseModel

class VyskladneniRequest(BaseModel):
    duvod: str  # expirace, rozbito, chyba, jine
    poznamka: str = ""

@router.get("/duvody")
def get_vyskladneni_duvody():
    """Vrátí dostupné důvody vyskladnění"""
    return {
        "status": "success",
        "data": VYSSKLADNENI_DUVODY,
        "message": "Důvody vyskladnění načteny"
    }

@router.delete("/items/{item_id}")
def archive_item(item_id: int, request: VyskladneniRequest, db: Session = Depends(get_database)):
    """Archivuje a smaže jednotlivou položku"""
    
    # Najdi položku
    item = db.query(Item).filter(Item.id == item_id, Item.stav == "aktivni").first()
    if not item:
        raise HTTPException(status_code=404, detail="Položka nebyla nalezena")
    
    # Najdi GB pro dodatečné info
    gb = db.query(Gitterbox).filter(Gitterbox.id == item.gitterbox_id).first()
    
    try:
        # Připrav data pro archivaci
        # Sloučení poznámek - pouze neprázdné části
        poznamky = []
        if item.poznamka and item.poznamka.strip():
            poznamky.append(item.poznamka.strip())
        if request.poznamka and request.poznamka.strip():
            poznamky.append(request.poznamka.strip())
        
        item_data = {
            'nazev_dilu': item.nazev_dilu,
            'tma_cislo': item.tma_cislo,
            'projekt': item.projekt,
            'popis_mnozstvi': item.popis_mnozstvi,
            'expiracni_datum': str(item.expiracni_datum) if item.expiracni_datum else '',
            'poznamka': ' | '.join(poznamky),
            'datum_zaskladneni': str(item.datum_zaskladneni),
            'gb_cislo': gb.cislo_gb if gb else ''
        }
        
        gb_info = {
            'cislo_gb': gb.cislo_gb,
            'zodpovedna_osoba': gb.zodpovedna_osoba
        } if gb else {}
        
        # Archivuj do Excel
        if not ArchiveService.archive_item(item_data, VYSSKLADNENI_DUVODY.get(request.duvod, request.duvod), gb_info):
            raise HTTPException(status_code=500, detail="Chyba při archivaci do Excel")
        
        # Smaž z databáze
        db.delete(item)
        
        # Aktualizuj naplněnost GB pokud existuje
        if gb:
            remaining_items = db.query(Item).filter(Item.gitterbox_id == gb.id, Item.stav == "aktivni").count()
            if remaining_items == 0:
                gb.naplnenost_procenta = 0
            # Případně lze implementovat sofistikovanější výpočet naplněnosti
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Položka '{item.nazev_dilu}' byla vyskladněna a archivována",
            "data": {
                "item_name": item.nazev_dilu,
                "gb_number": gb.cislo_gb if gb else None,
                "reason": VYSSKLADNENI_DUVODY.get(request.duvod, request.duvod),
                "archived_by": ArchiveService.get_windows_user()
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chyba při vyskladnění: {str(e)}")

@router.delete("/gitterboxes/{gb_id}")
def archive_gitterbox(gb_id: int, request: VyskladneniRequest, db: Session = Depends(get_database)):
    """Archivuje a smaže celý Gitterbox včetně všech položek"""
    
    # Najdi GB
    gb = db.query(Gitterbox).filter(Gitterbox.id == gb_id, Gitterbox.stav == "aktivni").first()
    if not gb:
        raise HTTPException(status_code=404, detail="Gitterbox nebyl nalezen")
    
    # Najdi všechny aktivní položky v GB
    items = db.query(Item).filter(Item.gitterbox_id == gb_id, Item.stav == "aktivni").all()
    
    try:
        # Připrav data pro archivaci
        # Sloučení poznámek GB - pouze neprázdné části
        gb_poznamky = []
        if gb.poznamka and gb.poznamka.strip():
            gb_poznamky.append(gb.poznamka.strip())
        if request.poznamka and request.poznamka.strip():
            gb_poznamky.append(request.poznamka.strip())
            
        gb_data = {
            'cislo_gb': gb.cislo_gb,
            'zodpovedna_osoba': gb.zodpovedna_osoba,
            'poznamka': ' | '.join(gb_poznamky),
            'datum_zalozeni': str(gb.datum_zalozeni),
            'naplnenost_procenta': gb.naplnenost_procenta
        }
        
        items_data = []
        for item in items:
            items_data.append({
                'nazev_dilu': item.nazev_dilu,
                'tma_cislo': item.tma_cislo,
                'projekt': item.projekt,
                'popis_mnozstvi': item.popis_mnozstvi,
                'expiracni_datum': str(item.expiracni_datum) if item.expiracni_datum else '',
                'poznamka': item.poznamka,
                'datum_zaskladneni': str(item.datum_zaskladneni)
            })
        
        # Archivuj do Excel
        if not ArchiveService.archive_gitterbox(gb_data, items_data, VYSSKLADNENI_DUVODY.get(request.duvod, request.duvod)):
            raise HTTPException(status_code=500, detail="Chyba při archivaci do Excel")
        
        # Smaž všechny položky
        for item in items:
            db.delete(item)
        
        # Smaž GB
        db.delete(gb)
        
        # Uvolni pozici
        pozice = db.query(Position).filter(Position.id == gb.position_id).first()
        if pozice:
            pozice.status = "volna"
        
        db.commit()
        
        return {
            "status": "success", 
            "message": f"Gitterbox #{gb.cislo_gb} byl kompletně vyskladněn a archivován",
            "data": {
                "gb_number": gb.cislo_gb,
                "items_count": len(items),
                "reason": VYSSKLADNENI_DUVODY.get(request.duvod, request.duvod),
                "archived_by": ArchiveService.get_windows_user(),
                "position_freed": True
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chyba při vyskladnění GB: {str(e)}")

@router.get("/stats")
def get_archive_stats():
    """Vrátí statistiky archivních dat"""
    try:
        stats = ArchiveService.get_archive_stats()
        return {
            "status": "success",
            "data": stats,
            "message": "Archivní statistiky načteny"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání statistik: {str(e)}")

@router.get("/export")
def download_archive():
    """Umožní stažení Excel souboru s archivem"""
    from fastapi.responses import FileResponse
    from services.archive_service import ARCHIVE_FILE
    
    if not ARCHIVE_FILE.exists():
        raise HTTPException(status_code=404, detail="Archivní soubor neexistuje")
    
    return FileResponse(
        path=str(ARCHIVE_FILE),
        filename=f"vyskladneno_archiv_{date.today().strftime('%Y%m%d')}.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
