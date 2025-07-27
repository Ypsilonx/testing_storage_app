"""
Test script pro automatizované testování formulářů
Autor: GitHub Copilot
Datum: 27.7.2025
"""

import requests
import json
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
    
    def test_api_endpoint(self, method, endpoint, data=None, expected_status=200, description=""):
        """Test API endpoint"""
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if method.upper() == "GET":
                response = self.session.get(url)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            
            success = response.status_code == expected_status
            
            result = {
                "description": description,
                "method": method.upper(),
                "endpoint": endpoint,
                "status_code": response.status_code,
                "expected_status": expected_status,
                "success": success,
                "response_data": response.json() if response.content else None,
                "timestamp": datetime.now().isoformat()
            }
            
            self.test_results.append(result)
            
            status_icon = "✅" if success else "❌"
            print(f"{status_icon} {description}")
            if not success:
                print(f"   Expected: {expected_status}, Got: {response.status_code}")
                if response.content:
                    print(f"   Response: {response.text[:200]}...")
            
            return response.json() if response.content else None
            
        except Exception as e:
            print(f"❌ {description} - Error: {e}")
            self.test_results.append({
                "description": description,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            return None
    
    def run_comprehensive_tests(self):
        """Spustí kompletní test suite"""
        print("🚀 Spouštím automatizované testy API...")
        print("=" * 60)
        
        # Test 1: Základní GET endpointy
        print("\n📡 Test 1: Základní API endpointy")
        self.test_api_endpoint("GET", "/api/locations", description="Načtení lokací")
        shelves = self.test_api_endpoint("GET", "/api/positions/shelves", description="Načtení regálů")
        positions = self.test_api_endpoint("GET", "/api/positions/available", description="Volné pozice")
        gitterboxes = self.test_api_endpoint("GET", "/api/gitterboxes", description="Seznam gitterboxů")
        
        # Test 2: CRUD operace s Gitterboxem
        print("\n📦 Test 2: CRUD operace s Gitterboxem")
        
        # Vytvoření nového GB
        # Nejdříve najdeme volnou pozici
        if positions and positions.get('data'):
            available_pos = positions['data']
            if available_pos:
                position_id = available_pos[0]['id']  # První volná pozice
            else:
                position_id = 50  # Pokus o pozici, která by měla být volná
        else:
            position_id = 50
        
        new_gb_data = {
            "zodpovedna_osoba": "Test User",
            "position_id": position_id,
            "naplnenost_procenta": 80,
            "poznamka": "Automatický test"
        }
        
        created_gb = self.test_api_endpoint(
            "POST", "/api/gitterboxes", 
            data=new_gb_data,
            expected_status=201,
            description="Vytvoření nového GB"
        )
        
        gb_id = None
        if created_gb:
            gb_id = created_gb.get('id')
            
            # Načtení vytvořeného GB
            self.test_api_endpoint(
                "GET", f"/api/gitterboxes/{gb_id}",
                description=f"Načtení GB #{gb_id}"
            )
            
            # Úprava GB
            update_data = {
                "zodpovedna_osoba": "Updated Test User",
                "position_id": 2,  # Jiná pozice
                "naplnenost_procenta": 90,
                "poznamka": "Aktualizovaný test"
            }
            
            self.test_api_endpoint(
                "PUT", f"/api/gitterboxes/{gb_id}",
                data=update_data,
                description=f"Úprava GB #{gb_id}"
            )
        
        # Test 3: CRUD operace s položkami
        print("\n📝 Test 3: CRUD operace s položkami")
        
        if gb_id:
            # Přidání položky do GB
            item_data = {
                "gitterbox_id": gb_id,
                "tma_cislo": "EU-SVA-123456-25",
                "projekt": "Test Projekt",
                "nazev_dilu": "Test díl",
                "pocet_kusu": 10,
                "sledovat_expiraci": True,
                "poznamka": "Test položka"
            }
            
            created_item = self.test_api_endpoint(
                "POST", "/api/items",
                data=item_data,
                expected_status=201,
                description="Přidání položky do GB"
            )
            
            if created_item:
                item_id = created_item.get('id')
                
                # Načtení položky
                self.test_api_endpoint(
                    "GET", f"/api/items/{item_id}",
                    description=f"Načtení položky #{item_id}"
                )
                
                # Úprava položky
                update_item_data = {
                    "nazev_dilu": "Aktualizovaný test díl",
                    "pocet_kusu": 15,
                    "projekt": "Aktualizovaný projekt"
                }
                
                self.test_api_endpoint(
                    "PUT", f"/api/items/{item_id}",
                    data=update_item_data,
                    description=f"Úprava položky #{item_id}"
                )
        
        # Test 4: Validace a chybové stavy
        print("\n⚠️  Test 4: Validace a error handling")
        
        # Pokus o vytvoření GB s neplatnou pozicí
        invalid_gb_data = {
            "zodpovedna_osoba": "",  # Prázdné jméno
            "position_id": 9999,  # Neexistující pozice
            "naplnenost_procenta": 150  # Neplatná hodnota
        }
        
        self.test_api_endpoint(
            "POST", "/api/gitterboxes",
            data=invalid_gb_data,
            expected_status=422,  # Validation Error
            description="Validace neplatných dat GB"
        )
        
        # Pokus o načtení neexistujícího GB
        self.test_api_endpoint(
            "GET", "/api/gitterboxes/9999",
            expected_status=404,
            description="Načtení neexistujícího GB"
        )
        
        # Test 5: Výsledky
        self.print_test_summary()
    
    def print_test_summary(self):
        """Zobrazí souhrn testů"""
        print("\n" + "=" * 60)
        print("📊 SOUHRN TESTŮ")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r.get('success', False)])
        failed_tests = total_tests - successful_tests
        
        print(f"📈 Celkem testů: {total_tests}")
        print(f"✅ Úspěšné: {successful_tests}")
        print(f"❌ Neúspěšné: {failed_tests}")
        print(f"📊 Úspěšnost: {(successful_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ Selhané testy:")
            for result in self.test_results:
                if not result.get('success', False):
                    print(f"   - {result.get('description', 'Unknown test')}")
                    if 'error' in result:
                        print(f"     Error: {result['error']}")
        
        print("\n✅ Testování dokončeno!")

def main():
    """Hlavní funkce pro spuštění testů"""
    print("🧪 Automatizované testování skladové aplikace")
    print("=" * 60)
    
    # Zkontroluj, jestli server běží
    try:
        response = requests.get(f"{BASE_URL}/api/positions/available", timeout=5)
        print("✅ Server je dostupný")
    except requests.exceptions.RequestException:
        print("❌ Server není dostupný na http://localhost:8000")
        print("   Spusť server pomocí: uvicorn backend.main:app --reload")
        return
    
    # Spusť testy
    tester = APITester()
    tester.run_comprehensive_tests()

if __name__ == "__main__":
    main()
