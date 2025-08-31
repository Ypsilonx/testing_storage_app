#!/usr/bin/env python3
"""
Produkční startup script pro skladovou aplikaci
Použití: python start_production.py
"""

import os
import sys
import uvicorn
from pathlib import Path

# Nastavení produkčních cest
BASE_DIR = Path(__file__).parent
sys.path.append(str(BASE_DIR))

# Import aplikace
from main import app

if __name__ == "__main__":
    # Produkční konfigurace
    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        workers=2,  # Více workerů pro produkci
        access_log=True,
        log_level="info"
    )
