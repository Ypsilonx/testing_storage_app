"""
Spouštěcí script pro rychlé testování
"""

if __name__ == "__main__":
    import sys
    import os
    
    # Přidáme backend do sys.path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, backend_dir)
    
    print(f"🔧 Sys path: {backend_dir}")
    
    # Import a spuštění
    try:
        import uvicorn
        from main import app
        
        print("✅ Import úspěšný!")
        print("🚀 Spouštím server...")
        
        uvicorn.run(app, host="0.0.0.0", port=8000)
        
    except Exception as e:
        print(f"❌ Chyba: {e}")
        import traceback
        traceback.print_exc()
