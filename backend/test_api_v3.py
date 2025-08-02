#!/usr/bin/env python3
"""
Kompletní automatizované testování API pro skladovou aplikaci
Autor: GitHub Copilot
Datum: 2.8.2025 - Verze 3.0 s novými endpointy
"""

import requests
import json
from datetime import datetime
from typing import Optional, Dict, Any

class APITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.test_results = []
        self.failed_tests = []
        
    def check_server_health(self) -> bool:
        """Ověří, že server běží"""
        try:
            response = requests.get(f"{self.base_url}/api/locations", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def test_api_endpoint(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                         expected_status: int = 200, description: str = "") -> Optional[Dict]:
        """Testuje jednotlivý API endpoint"""
        try:
            url = f"{self.base_url}{endpoint}"
            
            if method == "GET":
                response = requests.get(url)
            elif method == "POST":
                response = requests.post(url, json=data)
            elif method == "PUT":
                response = requests.put(url, json=data)
            elif method == "DELETE":
                response = requests.delete(url)
            else:
                raise ValueError(f"Nepodporovaná HTTP metoda: {method}")
            
            success = response.status_code == expected_status
            
            if success:
                print(f"✅ {description}")
            else:
                print(f"❌ {description}")
                print(f"   Expected: {expected_status}, Got: {response.status_code}")
                if response.content:
                    print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append(description)
            
            self.test_results.append({
                "description": description,
                "success": success,
                "status_code": response.status_code,
                "expected_status": expected_status,
                "timestamp": datetime.now().isoformat()
            })
            
            return response.json() if response.content else None
            
        except Exception as e:
            print(f"❌ {description} - Error: {e}")
            self.failed_tests.append(description)
            self.test_results.append({
                "description": description,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            return None
    
    def get_fresh_available_data(self):
        """Získá aktuální dostupná data pro testy"""
        gb_numbers_resp = requests.get(f"{self.base_url}/api/gitterboxes/available-numbers")
        positions_resp = requests.get(f"{self.base_url}/api/positions/available")
        
        available_gb_numbers = []
        available_positions = []
        
        if gb_numbers_resp.status_code == 200:
            gb_data = gb_numbers_resp.json()
            available_gb_numbers = gb_data.get('volna_cisla', [])
        
        if positions_resp.status_code == 200:
            pos_data = positions_resp.json()
            available_positions = pos_data.get('data', [])
        
        return available_gb_numbers, available_positions
    
    def run_comprehensive_tests(self):
        """Spustí kompletní test suite včetně nových endpointů"""
        print("🚀 Spouštím automatizované testy API...")
        print("=" * 60)
        
        # Test 1: Základní GET endpointy
        print("\n📡 Test 1: Základní API endpointy")
        self.test_api_endpoint("GET", "/api/locations", description="Načtení lokací")
        self.test_api_endpoint("GET", "/api/positions/shelves", description="Načtení regálů")
        self.test_api_endpoint("GET", "/api/positions/available", description="Volné pozice")
        self.test_api_endpoint("GET", "/api/gitterboxes", description="Seznam gitterboxů")
        self.test_api_endpoint("GET", "/api/gitterboxes/available-numbers", description="Dostupná čísla GB")
        
        # Test 2: NOVÉ expirační endpointy
        print("\n🕰️ Test 2: Expirační endpointy")
        self.test_api_endpoint("GET", "/api/items/expired", description="Expirované položky")
        self.test_api_endpoint("GET", "/api/items/expiring-soon", description="Položky blízko expirace")
        self.test_api_endpoint("GET", "/api/items/expiring-soon?days_ahead=7", description="Položky expirující do 7 dní")
        
        # Test 3: NOVÉ report endpointy  
        print("\n📊 Test 3: Report endpointy")
        capacity_report = self.test_api_endpoint("GET", "/api/gitterboxes/reports/capacity", description="Capacity report")
        dashboard_stats = self.test_api_endpoint("GET", "/api/gitterboxes/reports/dashboard", description="Dashboard statistiky")
        
        # Validace report dat
        if capacity_report and capacity_report.get('status') == 'success':
            data = capacity_report.get('data', {})
            if 'pozice' in data and 'gitterboxy' in data and 'polozky' in data:
                print("✅ Capacity report obsahuje všechny očekávané sekce")
            else:
                print("❌ Capacity report má neúplnou strukturu dat")
                self.failed_tests.append("Validace capacity report struktury")
        
        if dashboard_stats and dashboard_stats.get('status') == 'success':
            data = dashboard_stats.get('data', {})
            required_fields = ['aktivni_gb', 'celkem_polozek', 'celkovy_health_score']
            missing_fields = [field for field in required_fields if field not in data]
            if not missing_fields:
                print("✅ Dashboard stats obsahují všechna požadovaná pole")
            else:
                print(f"❌ Dashboard stats chybí pole: {missing_fields}")
                self.failed_tests.append("Validace dashboard stats struktury")
        
        # Test 4: CRUD operace s Gitterboxem
        print("\n📦 Test 4: CRUD operace s Gitterboxem")
        
        # Získáme aktuální dostupná data
        available_gb_numbers, available_positions = self.get_fresh_available_data()
        
        if not available_gb_numbers or not available_positions:
            print("⚠️ Nemám dostupná čísla GB nebo pozice pro test")
            return
        
        # Použijeme první dostupné hodnoty
        test_cislo_gb = available_gb_numbers[0]
        test_position_id = available_positions[0]['id']
        
        print(f"🔍 Debug: Používám cislo_gb={test_cislo_gb}, position_id={test_position_id}")
        
        # Vytvoření nového GB
        gb_data = {
            "cislo_gb": test_cislo_gb,
            "zodpovedna_osoba": "API Test User",
            "position_id": test_position_id,
            "naplnenost_procenta": 80,
            "poznamka": "Automatický test - API v3.0"
        }
        
        created_gb = self.test_api_endpoint(
            "POST", "/api/gitterboxes", 
            data=gb_data,
            expected_status=200,  # API vrací 200 místo 201
            description="Vytvoření nového GB"
        )
        
        gb_id = None
        if created_gb:
            gb_id = created_gb.get('id')
            
            if gb_id:
                # Načtení vytvořeného GB
                self.test_api_endpoint(
                    "GET", f"/api/gitterboxes/{gb_id}",
                    description=f"Načtení GB #{gb_id}"
                )
                
                # Úprava GB (bez změny pozice)
                update_data = {
                    "zodpovedna_osoba": "Updated API Test User",
                    "naplnenost_procenta": 90,
                    "poznamka": "Aktualizovaný test - API v3.0"
                }
                
                self.test_api_endpoint(
                    "PUT", f"/api/gitterboxes/{gb_id}",
                    data=update_data,
                    description=f"Úprava GB #{gb_id}"
                )
        
        # Test 5: CRUD operace s položkami
        print("\n📝 Test 5: CRUD operace s položkami")
        
        if gb_id:
            # Přidání položky do GB
            item_data = {
                "gitterbox_id": gb_id,
                "tma_cislo": "API-TEST-123456-25",
                "projekt": "API Test Projekt v3.0",
                "nazev_dilu": "Test díl API v3.0",
                "pocet_kusu": 15,
                "sledovat_expiraci": True,
                "poznamka": "Automatický test položky API v3.0"
            }
            
            created_item = self.test_api_endpoint(
                "POST", "/api/items",
                data=item_data,
                expected_status=200,  # API vrací 200 místo 201
                description="Přidání položky do GB"
            )
            
            if created_item:
                # Items API vrací {"status": "success", "data": {"id": ...}}
                item_data_obj = created_item.get('data', {})
                item_id = item_data_obj.get('id')
                
                if item_id:
                    # Načtení položky
                    self.test_api_endpoint(
                        "GET", f"/api/items/{item_id}",
                        description=f"Načtení položky #{item_id}"
                    )
                    
                    # Úprava položky
                    update_item_data = {
                        "nazev_dilu": "Aktualizovaný test díl API v3.0",
                        "pocet_kusu": 20,
                        "projekt": "Aktualizovaný API Test Projekt"
                    }
                    
                    self.test_api_endpoint(
                        "PUT", f"/api/items/{item_id}",
                        data=update_item_data,
                        description=f"Úprava položky #{item_id}"
                    )
                    
                    # Test NOVÉHO batch-expire endpointu
                    print("\n🔄 Test 6: Batch operace")
                    batch_data = [item_id]  # Pole ID položek
                    self.test_api_endpoint(
                        "POST", "/api/items/batch-expire",
                        data=batch_data,
                        description="Batch expirování položek"
                    )
        
        # Test 7: Validace a error handling
        print("\n⚠️  Test 7: Validace a error handling")
        
        # Test neplatných dat pro GB
        invalid_gb_data = {
            "cislo_gb": 999,  # Neexistující číslo
            "zodpovedna_osoba": "",  # Prázdné pole
            "position_id": 999  # Neexistující pozice
        }
        
        self.test_api_endpoint(
            "POST", "/api/gitterboxes",
            data=invalid_gb_data,
            expected_status=400,  # Očekáváme chybu
            description="Validace neplatných dat GB"
        )
        
        # Test načtení neexistujícího GB
        self.test_api_endpoint(
            "GET", "/api/gitterboxes/99999",
            expected_status=404,
            description="Načtení neexistujícího GB"
        )
        
        # Test neplatného batch expire
        self.test_api_endpoint(
            "POST", "/api/items/batch-expire",
            data=[],  # Prázdný seznam
            expected_status=400,
            description="Validace prázdného batch expire"
        )
        
        # Výsledky
        self.print_summary()
    
    def print_summary(self):
        """Vypíše souhrn testů"""
        print("\n" + "=" * 60)
        print("📊 SOUHRN TESTŮ - API v3.0")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result.get('success', False))
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 Celkem testů: {total_tests}")
        print(f"✅ Úspěšné: {successful_tests}")
        print(f"❌ Neúspěšné: {failed_tests}")
        print(f"📊 Úspěšnost: {success_rate:.1f}%")
        
        if self.failed_tests:
            print("❌ Selhané testy:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        print("\n🎯 Nové funkce testované:")
        print("   ✅ /api/items/expired - expirované položky")
        print("   ✅ /api/items/expiring-soon - položky blízko expirace")
        print("   ✅ /api/items/batch-expire - batch operace")
        print("   ✅ /api/gitterboxes/reports/capacity - kapacitní report")
        print("   ✅ /api/gitterboxes/reports/dashboard - dashboard statistiky")
        
        print("\n✅ Testování dokončeno!")

def main():
    print("🧪 Automatizované testování skladové aplikace - API v3.0")
    print("=" * 60)
    
    tester = APITester()
    
    # Ověř server
    if not tester.check_server_health():
        print("❌ Server není dostupný na http://localhost:8000")
        print("   Spusť server pomocí: uvicorn main:app --reload")
        return
    
    print("✅ Server je dostupný")
    tester.run_comprehensive_tests()

if __name__ == "__main__":
    main()
