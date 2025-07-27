<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Skladová aplikace pro Gitterbox management

Toto je Python FastAPI aplikace pro správu skladu s následujícími klíčovými vlastnostmi:

## Technický stack
- **Backend**: Python FastAPI + SQLAlchemy + SQLite
- **Frontend**: Vanilla HTML/CSS/JavaScript s Tailwind CSS
- **Database**: SQLite pro development, PostgreSQL ready

## Klíčové koncepty
- **Globální číslování GB**: Čísla 1 až celkový počet pozic ve všech regálech
- **Dvoustupňové workflow**: Založení GB → přidávání položek
- **Flexibilní sledování**: TMA čísla a projekty jsou volitelné
- **Vizuální regály**: Barevné kódování dle stavu a naplněnosti

## Architektura
- Dvě hlavní záložky: REGÁLY (rychlá orientace) + VYHLEDÁVÁNÍ (detailní práce)
- Stromová struktura skladu s fulltext vyhledáváním
- Export do PDF/Excel s tiskovou funkcionalitou

## Coding konvence
- Používej české názvy pro databázové sloupce a komentáře
- API endpoints v angličtině
- Validace všech vstupů na backend straně
- Error handling s informativními zprávami
- SQL názvy tabulek v množném čísle (locations, gitterboxes, items)

## Specifické požadavky
- Expirace automaticky za 1 rok, ale lze vypnout pro položku
- Počet kusů pro každou položku s jednotkami
- Naplněnost GB v procentech s vizuálním šrafováním
- Propojení mezi záložkami (breadcrumbs)
