"""
Archivační služba pro vyskladněné položky
Autor: GitHub Copilot
Datum: 2.8.2025

Funkcionalita:
- Export položek/GB do Excel před smazáním z DB
- Sledování Windows uživatelů
- Důvody vyskladnění
- Ukládání do docs/ složky
"""

import os
import pandas as pd
from datetime import datetime
import getpass
from typing import List, Dict, Any, Optional
from pathlib import Path

# Cesta k docs složce
DOCS_DIR = Path(__file__).parent.parent / "docs"
ARCHIVE_FILE = DOCS_DIR / "vyskladneno_archiv.xlsx"

class ArchiveService:
    
    @staticmethod
    def get_windows_user() -> str:
        """Získá jméno Windows uživatele"""
        return os.environ.get('USERNAME') or getpass.getuser()
    
    @staticmethod
    def get_timestamp() -> str:
        """Získá aktuální timestamp"""
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    @staticmethod
    def archive_item(item_data: Dict[str, Any], reason: str, gb_info: Optional[Dict] = None) -> bool:
        """
        Archivuje jednotlivou položku do Excel souboru
        
        Args:
            item_data: Data položky z databáze
            reason: Důvod vyskladnění (expirace, rozbito, chyba, jiné)
            gb_info: Informace o GB (volitelné)
        
        Returns:
            bool: True při úspěchu
        """
        try:
            # Připrav záznam pro Excel
            record = {
                'Datum': datetime.now().strftime("%Y-%m-%d"),
                'Čas': datetime.now().strftime("%H:%M:%S"),
                'Windows_User': ArchiveService.get_windows_user(),
                'Typ': 'Položka',
                'GB_Číslo': gb_info.get('cislo_gb') if gb_info else item_data.get('gb_cislo', ''),
                'Název_dílu': item_data.get('nazev_dilu', ''),
                'TMA_číslo': item_data.get('tma_cislo', ''),
                'Projekt': item_data.get('projekt', ''),
                'Množství': item_data.get('popis_mnozstvi', ''),
                'Expirace': item_data.get('expiracni_datum', ''),
                'Důvod_vyskladnění': reason,
                'Poznámka': item_data.get('poznamka', ''),
                'Datum_zaskladnění': item_data.get('datum_zaskladneni', ''),
                'Zodpovědná_osoba': gb_info.get('zodpovedna_osoba') if gb_info else ''
            }
            
            return ArchiveService._append_to_excel([record])
            
        except Exception as e:
            print(f"Chyba při archivaci položky: {e}")
            return False
    
    @staticmethod
    def archive_gitterbox(gb_data: Dict[str, Any], items_data: List[Dict], reason: str) -> bool:
        """
        Archivuje celý Gitterbox včetně všech položek
        
        Args:
            gb_data: Data GB z databáze
            items_data: Seznam všech položek v GB
            reason: Důvod vyskladnění
        
        Returns:
            bool: True při úspěchu
        """
        try:
            records = []
            timestamp = ArchiveService.get_timestamp()
            user = ArchiveService.get_windows_user()
            
            # Záznam pro celý GB
            gb_record = {
                'Datum': datetime.now().strftime("%Y-%m-%d"),
                'Čas': datetime.now().strftime("%H:%M:%S"),
                'Windows_User': user,
                'Typ': 'Celý_GB',
                'GB_Číslo': gb_data.get('cislo_gb', ''),
                'Název_dílu': f"KOMPLETNÍ GB #{gb_data.get('cislo_gb', '')}",
                'TMA_číslo': '',
                'Projekt': '',
                'Množství': f"{len(items_data)} položek",
                'Expirace': '',
                'Důvod_vyskladnění': reason,
                'Poznámka': gb_data.get('poznamka', ''),
                'Datum_zaskladnění': gb_data.get('datum_zalozeni', ''),
                'Zodpovědná_osoba': gb_data.get('zodpovedna_osoba', '')
            }
            records.append(gb_record)
            
            # Záznamy pro jednotlivé položky
            for item in items_data:
                item_record = {
                    'Datum': datetime.now().strftime("%Y-%m-%d"),
                    'Čas': datetime.now().strftime("%H:%M:%S"),
                    'Windows_User': user,
                    'Typ': 'Položka_z_GB',
                    'GB_Číslo': gb_data.get('cislo_gb', ''),
                    'Název_dílu': item.get('nazev_dilu', ''),
                    'TMA_číslo': item.get('tma_cislo', ''),
                    'Projekt': item.get('projekt', ''),
                    'Množství': item.get('popis_mnozstvi', ''),
                    'Expirace': item.get('expiracni_datum', ''),
                    'Důvod_vyskladnění': reason,
                    'Poznámka': item.get('poznamka', ''),
                    'Datum_zaskladnění': item.get('datum_zaskladneni', ''),
                    'Zodpovědná_osoba': gb_data.get('zodpovedna_osoba', '')
                }
                records.append(item_record)
            
            return ArchiveService._append_to_excel(records)
            
        except Exception as e:
            print(f"Chyba při archivaci GB: {e}")
            return False
    
    @staticmethod
    def _append_to_excel(records: List[Dict[str, Any]]) -> bool:
        """
        Přidá záznamy do Excel souboru
        
        Args:
            records: Seznam záznamů k přidání
        
        Returns:
            bool: True při úspěchu
        """
        try:
            # Ujisti se, že docs složka existuje
            DOCS_DIR.mkdir(exist_ok=True)
            
            # Vytvoř DataFrame z nových záznamů
            new_df = pd.DataFrame(records)
            
            # Pokud soubor existuje, načti ho a přidej nové záznamy
            if ARCHIVE_FILE.exists():
                existing_df = pd.read_excel(ARCHIVE_FILE)
                combined_df = pd.concat([existing_df, new_df], ignore_index=True)
            else:
                combined_df = new_df
            
            # Seřaď podle data (nejnovější nahoře)
            combined_df['Datum_Time'] = pd.to_datetime(combined_df['Datum'] + ' ' + combined_df['Čas'])
            combined_df = combined_df.sort_values('Datum_Time', ascending=False)
            combined_df = combined_df.drop('Datum_Time', axis=1)
            
            # Ulož do Excel
            with pd.ExcelWriter(ARCHIVE_FILE, engine='openpyxl') as writer:
                combined_df.to_excel(writer, sheet_name='Vyskladněno', index=False)
                
                # Formátování
                worksheet = writer.sheets['Vyskladněno']
                
                # Automatické šířky sloupců
                for column in worksheet.columns:
                    max_length = 0
                    column = [cell for cell in column]
                    for cell in column:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    adjusted_width = min(max_length + 2, 50)
                    worksheet.column_dimensions[column[0].column_letter].width = adjusted_width
            
            print(f"✅ Archivováno {len(records)} záznamů do {ARCHIVE_FILE}")
            return True
            
        except Exception as e:
            print(f"❌ Chyba při ukládání do Excel: {e}")
            return False
    
    @staticmethod
    def get_archive_stats() -> Dict[str, Any]:
        """Vrátí statistiky archivních dat"""
        try:
            if not ARCHIVE_FILE.exists():
                return {"celkem": 0, "dnes": 0, "tento_mesic": 0}
            
            df = pd.read_excel(ARCHIVE_FILE)
            today = datetime.now().strftime("%Y-%m-%d")
            this_month = datetime.now().strftime("%Y-%m")
            
            return {
                "celkem": len(df),
                "dnes": len(df[df['Datum'] == today]),
                "tento_mesic": len(df[df['Datum'].str.startswith(this_month)]),
                "posledni_archiv": df.iloc[0]['Datum'] + ' ' + df.iloc[0]['Čas'] if len(df) > 0 else None
            }
            
        except Exception as e:
            print(f"Chyba při načítání archivních statistik: {e}")
            return {"celkem": 0, "dnes": 0, "tento_mesic": 0}


# Konstanty pro důvody vyskladnění
VYSSKLADNENI_DUVODY = {
    "expirace": "Expirace",
    "rozbito": "Rozbito/Poškozeno", 
    "chyba": "Chyba/Špatně zaskladněno",
    "jine": "Jiné"
}
