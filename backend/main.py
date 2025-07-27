"""
Hlavní FastAPI aplikace pro skladovou správu
Autor: GitHub Copilot
Datum: 27.7.2025
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from pathlib import Path

from database import get_database, init_database, get_storage_statistics
from models import Location, Shelf, Position, Gitterbox, Item
from routers import gitterboxes, items, positions

# Vytvoření FastAPI aplikace
app = FastAPI(
    title="Skladová aplikace pro Gitterboxy",
    description="Webová aplikace pro správu skladu s vizualizací regálů",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware pro frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # V produkci omezit na konkrétní domény
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (frontend)
static_path = Path(__file__).parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# === ROUTERY ===

# Přidání routeru pro Gitterboxy
app.include_router(gitterboxes.router)

# Přidání routeru pro položky
app.include_router(items.router)

# Přidání routeru pro pozice
app.include_router(positions.router)


@app.on_event("startup")
async def startup_event():
    """Inicializace při spuštění aplikace"""
    print("🚀 Spouštím skladovou aplikaci...")
    init_database()
    print("✅ Aplikace připravena!")


@app.get("/", response_class=HTMLResponse)
async def root():
    """Hlavní stránka aplikace"""
    # Pokud existuje index.html ve static, vrátíme ho
    static_index = Path(__file__).parent / "static" / "index.html"
    if static_index.exists():
        return FileResponse(static_index)
    
    # Jinak základní HTML placeholder
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Skladová aplikace</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
            .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .links { margin: 20px 0; }
            .links a { display: inline-block; margin-right: 20px; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; }
            .links a:hover { background: #2980b9; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📦 Skladová aplikace pro Gitterboxy</h1>
            <div class="status">
                <h3>✅ Backend běží úspěšně!</h3>
                <p>FastAPI server je připraven a databáze inicializována.</p>
            </div>
            
            <div class="links">
                <a href="/api/docs">📖 API Dokumentace</a>
                <a href="/api/statistics">📊 Statistiky skladu</a>
                <a href="/api/locations">📍 Seznam lokací</a>
            </div>
            
            <h3>🔄 Další kroky:</h3>
            <ul>
                <li>Frontend HTML/CSS/JS soubory budou v <code>/backend/static/</code></li>
                <li>API endpointy jsou dostupné na <code>/api/*</code></li>
                <li>Databáze je automaticky inicializována s testovacími daty</li>
            </ul>
        </div>
    </body>
    </html>
    """)


# === API ENDPOINTY ===

@app.get("/api/statistics")
async def get_statistics():
    """Základní statistiky skladu"""
    try:
        stats = get_storage_statistics()
        return {
            "status": "success",
            "data": stats,
            "message": "Statistiky skladu úspěšně načteny"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání statistik: {str(e)}")


@app.get("/api/locations")
async def get_locations(db: Session = Depends(get_database)):
    """Seznam všech lokací s regály"""
    try:
        locations = db.query(Location).all()
        result = []
        
        for location in locations:
            regaly = []
            for shelf in location.regaly:
                regaly.append({
                    "id": shelf.id,
                    "nazev": shelf.nazev,
                    "rozmer": f"{shelf.radky}x{shelf.sloupce}",
                    "celkem_pozic": shelf.celkem_pozic,
                    "typ": shelf.typ
                })
            
            result.append({
                "id": location.id,
                "nazev": location.nazev,
                "popis": location.popis,
                "regaly": regaly
            })
        
        return {
            "status": "success",
            "data": result,
            "message": f"Načteno {len(result)} lokací"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání lokací: {str(e)}")


@app.get("/api/shelves/{shelf_id}/positions")
async def get_shelf_positions(shelf_id: int, db: Session = Depends(get_database)):
    """Pozice konkrétního regálu s informacemi o obsazenosti"""
    try:
        shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
        if not shelf:
            raise HTTPException(status_code=404, detail="Regál nebyl nalezen")
        
        positions = db.query(Position).filter(Position.shelf_id == shelf_id).all()
        
        result = {
            "regal": {
                "id": shelf.id,
                "nazev": shelf.nazev,
                "radky": shelf.radky,
                "sloupce": shelf.sloupce,
                "celkem_pozic": shelf.celkem_pozic
            },
            "pozice": []
        }
        
        for pozice in positions:
            pozice_data = {
                "id": pozice.id,
                "radek": pozice.radek,
                "sloupec": pozice.sloupec,
                "nazev": pozice.nazev_pozice,
                "status": pozice.status,
                "gitterbox": None
            }
            
            # Pokud je pozice obsazená, přidáme info o GB
            if pozice.gitterbox:
                gb = pozice.gitterbox
                pozice_data["gitterbox"] = {
                    "cislo_gb": gb.cislo_gb,
                    "zodpovedna_osoba": gb.zodpovedna_osoba,
                    "pocet_polozek": gb.pocet_polozek,
                    "naplnenost_procenta": gb.naplnenost_procenta,
                    "barva_indikace": gb.barva_indikace,
                    "ma_kriticke_expirace": gb.ma_kriticke_expirace
                }
            
            result["pozice"].append(pozice_data)
        
        return {
            "status": "success",
            "data": result,
            "message": f"Načteno {len(positions)} pozic regálu {shelf.nazev}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání pozic: {str(e)}")


@app.get("/api/positions/{position_id}")
async def get_position_detail(position_id: int, db: Session = Depends(get_database)):
    """Detail konkrétní pozice"""
    try:
        position = db.query(Position).filter(Position.id == position_id).first()
        if not position:
            raise HTTPException(status_code=404, detail="Pozice nebyla nalezena")
        
        result = {
            "id": position.id,
            "radek": position.radek,
            "sloupec": position.sloupec,
            "nazev": position.nazev_pozice,
            "status": position.status,
            "shelf": {
                "id": position.shelf.id,
                "nazev": position.shelf.nazev,
                "location": {
                    "id": position.shelf.lokace.id,
                    "nazev": position.shelf.lokace.nazev
                }
            }
        }
        
        return {
            "status": "success",
            "data": result,
            "message": f"Detail pozice {position.nazev_pozice}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání pozice: {str(e)}")


@app.get("/api/gitterboxes/{gb_id}/items")
async def get_gitterbox_items(gb_id: int, db: Session = Depends(get_database)):
    """Položky konkrétního Gitterboxu"""
    try:
        gb = db.query(Gitterbox).filter(Gitterbox.id == gb_id).first()
        if not gb:
            raise HTTPException(status_code=404, detail="Gitterbox nebyl nalezen")
        
        items = db.query(Item).filter(
            Item.gitterbox_id == gb_id,
            Item.stav == "aktivni"
        ).all()
        
        result = {
            "gitterbox": {
                "id": gb.id,
                "cislo_gb": gb.cislo_gb,
                "zodpovedna_osoba": gb.zodpovedna_osoba,
                "naplnenost_procenta": gb.naplnenost_procenta,
                "pozice": gb.pozice.nazev_pozice
            },
            "polozky": []
        }
        
        for item in items:
            result["polozky"].append({
                "id": item.id,
                "tma_cislo": item.tma_cislo,
                "projekt": item.projekt,
                "nazev_dilu": item.nazev_dilu,
                "popis_mnozstvi": item.popis_mnozstvi,
                "datum_zaskladneni": item.datum_zaskladneni.isoformat(),
                "sledovat_expiraci": item.sledovat_expiraci,
                "expiracni_datum": item.expiracni_datum.isoformat() if item.expiracni_datum else None,
                "je_blizko_expirace": item.je_blizko_expirace,
                "dny_do_expirace": item.dny_do_expirace,
                "poznamka": item.poznamka
            })
        
        return {
            "status": "success",
            "data": result,
            "message": f"Načteno {len(items)} položek z GB #{gb.cislo_gb}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání položek: {str(e)}")


@app.get("/api/gitterboxes/available-numbers")
async def get_available_gb_numbers(db: Session = Depends(get_database)):
    """Získání volných čísel Gitterboxů"""
    try:
        # Získej všechna používaná čísla GB
        obsazena_cisla = db.query(Gitterbox.cislo_gb).filter(Gitterbox.stav == 'aktivni').all()
        obsazena_cisla = [cislo[0] for cislo in obsazena_cisla]
        
        # Pokud nejsou žádná čísla, začni od 1
        if not obsazena_cisla:
            max_cislo = 1
        else:
            max_cislo = max(obsazena_cisla) + 10  # Rozšiř rozsah o 10
        
        # Vytvoř seznam všech čísel od 1 do max+10
        vsechna_cisla = set(range(1, max_cislo + 1))
        obsazena_cisla_set = set(obsazena_cisla)
        
        # Volná čísla
        volna_cisla = list(vsechna_cisla - obsazena_cisla_set)
        volna_cisla.sort()
        
        return {
            "status": "success",
            "data": {
                "volna_cisla": volna_cisla,
                "obsazena_cisla": sorted(obsazena_cisla),
                "celkem_volnych": len(volna_cisla),
                "celkem_obsazenych": len(obsazena_cisla),
                "max_cislo": max_cislo
            },
            "message": f"Nalezeno {len(volna_cisla)} volných čísel"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání čísel GB: {str(e)}")


@app.get("/api/health")


@app.get("/api/config/storage")
async def get_storage_config():
    """Aktuální konfigurace skladu"""
    try:
        from storage_config import get_storage_summary, ACTIVE_CONFIG
        
        summary = get_storage_summary()
        return {
            "status": "success",
            "data": {
                "summary": summary,
                "config": ACTIVE_CONFIG
            },
            "message": f"Konfigurace skladu: {summary['celkem_pozic']} pozic, GB čísla 1-{summary['max_cislo_gb']}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při načítání konfigurace: {str(e)}")


# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check pro monitoring"""
    return {
        "status": "healthy",
        "service": "Skladová aplikace",
        "version": "1.0.0",
        "timestamp": "2025-07-27"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
