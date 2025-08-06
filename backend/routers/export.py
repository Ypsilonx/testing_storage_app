"""
API router pro export dat
Autor: GitHub Copilot
Datum: 6.8.2025
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, String
from typing import List, Optional
from datetime import datetime, timedelta
import os
import tempfile
from pathlib import Path

from database import get_database
from models import Gitterbox, Item, Position, Shelf, Location
from services.export_service import ExportService

router = APIRouter(
    prefix="/api/export",
    tags=["Export"]
)

@router.get("/search/pdf")
async def export_search_to_pdf(
    query: Optional[str] = Query(None, description="Vyhledávací dotaz"),
    location_id: Optional[int] = Query(None, description="ID lokace"),
    project: Optional[str] = Query(None, description="Projekt"),
    person: Optional[str] = Query(None, description="Zodpovědná osoba"),
    status: Optional[str] = Query(None, description="Stav GB"),
    db: Session = Depends(get_database)
):
    """Export výsledků vyhledávání do PDF"""
    try:
        # Získej data na základě filtrů
        results = await _get_search_results(db, query, location_id, project, person, status)
        
        if not results:
            raise HTTPException(status_code=404, detail="Žádná data k exportu")
        
        # Vygeneruj PDF
        export_service = ExportService()
        pdf_path = export_service.create_search_pdf(results, {
            'query': query,
            'location_id': location_id, 
            'project': project,
            'person': person,
            'status': status
        })
        
        # Vygeneruj název souboru na základě filtrů
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename_parts = ["Sklad"]
        
        if query:
            # Zkrať dlouhé query na prvních 15 znaků
            clean_query = "".join(c for c in query if c.isalnum() or c in " -_")[:15]
            filename_parts.append(clean_query.replace(" ", "_"))
        
        if person:
            clean_person = "".join(c for c in person if c.isalnum() or c in " -_")[:20]
            filename_parts.append(clean_person.replace(" ", "_"))
            
        if project:
            clean_project = "".join(c for c in project if c.isalnum() or c in " -_")[:15]
            filename_parts.append(f"proj_{clean_project.replace(' ', '_')}")
            
        if location_id:
            filename_parts.append(f"lok_{location_id}")
            
        if status and status != "aktivni":
            filename_parts.append(status)
        
        filename = f"{'_'.join(filename_parts)}_{timestamp}.pdf"
        
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=filename,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při exportu do PDF: {str(e)}")

@router.get("/search/excel") 
async def export_search_to_excel(
    query: Optional[str] = Query(None, description="Vyhledávací dotaz"),
    location_id: Optional[int] = Query(None, description="ID lokace"),
    project: Optional[str] = Query(None, description="Projekt"),
    person: Optional[str] = Query(None, description="Zodpovědná osoba"),
    status: Optional[str] = Query(None, description="Stav GB"),
    db: Session = Depends(get_database)
):
    """Export výsledků vyhledávání do Excel"""
    try:
        # Získej data na základě filtrů
        results = await _get_search_results(db, query, location_id, project, person, status)
        
        if not results:
            raise HTTPException(status_code=404, detail="Žádná data k exportu")
        
        # Vygeneruj Excel
        export_service = ExportService()
        excel_path = export_service.create_search_excel(results, {
            'query': query,
            'location_id': location_id,
            'project': project, 
            'person': person,
            'status': status
        })
        
        # Vygeneruj název souboru na základě filtrů
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename_parts = ["Sklad"]
        
        if query:
            # Zkrať dlouhé query na prvních 15 znaků
            clean_query = "".join(c for c in query if c.isalnum() or c in " -_")[:15]
            filename_parts.append(clean_query.replace(" ", "_"))
        
        if person:
            clean_person = "".join(c for c in person if c.isalnum() or c in " -_")[:20]
            filename_parts.append(clean_person.replace(" ", "_"))
            
        if project:
            clean_project = "".join(c for c in project if c.isalnum() or c in " -_")[:15]
            filename_parts.append(f"proj_{clean_project.replace(' ', '_')}")
            
        if location_id:
            filename_parts.append(f"lok_{location_id}")
            
        if status and status != "aktivni":
            filename_parts.append(status)
        
        filename = f"{'_'.join(filename_parts)}_{timestamp}.xlsx"
        
        return FileResponse(
            excel_path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=filename,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při exportu do Excel: {str(e)}")

async def _get_search_results(db: Session, query: str = None, location_id: int = None, 
                             project: str = None, person: str = None, status: str = None):
    """Pomocná funkce pro získání vyhledávacích výsledků"""
    
    # Základní query
    gb_query = db.query(Gitterbox).filter(Gitterbox.stav == "aktivni")
    
    # Přidej JOINy pro vyhledávání
    gb_query = gb_query.join(Position).join(Shelf).join(Location)
    
    # Aplikuj filtry
    if location_id:
        gb_query = gb_query.filter(Location.id == location_id)
    
    if person:
        gb_query = gb_query.filter(Gitterbox.zodpovedna_osoba.ilike(f"%{person}%"))
        
    if status:
        gb_query = gb_query.filter(Gitterbox.stav == status)
        
    # Fulltext vyhledávání
    if query:
        # Rozdělej query na slova pro lepší vyhledávání
        search_terms = query.split()
        
        for term in search_terms:
            term_filter = or_(
                # Vyhledávání v GB
                Gitterbox.zodpovedna_osoba.ilike(f"%{term}%"),
                func.cast(Gitterbox.cislo_gb, String).ilike(f"%{term}%"),
                Gitterbox.poznamka.ilike(f"%{term}%"),
                # Vyhledávání v pozici
                Position.nazev_pozice.ilike(f"%{term}%"),
                # Vyhledávání v regálu a lokaci
                Shelf.nazev.ilike(f"%{term}%"),
                Location.nazev.ilike(f"%{term}%")
            )
            gb_query = gb_query.filter(term_filter)
    
    # Filtr podle projektu - potřebujeme vyhledat v items
    if project:
        # Subquery pro GB s položkami daného projektu
        gb_with_project = db.query(Item.gitterbox_id).filter(
            Item.stav == "aktivni",
            Item.projekt.ilike(f"%{project}%")
        ).distinct().subquery()
        
        gb_query = gb_query.filter(Gitterbox.id.in_(
            db.query(gb_with_project.c.gitterbox_id)
        ))
    
    # Spusť query
    gitterboxes = gb_query.order_by(Gitterbox.cislo_gb).all()
    
    # Sestavuj výsledky s položkami
    results = []
    for gb in gitterboxes:
        items = db.query(Item).filter(
            Item.gitterbox_id == gb.id,
            Item.stav == "aktivni"
        ).all()
        
        gb_data = {
            'gitterbox': gb,
            'items': items,
            'location': gb.pozice.regal.lokace,
            'shelf': gb.pozice.regal,
            'position': gb.pozice
        }
        results.append(gb_data)
    
    return results
