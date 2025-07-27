"""
Databázové modely pro skladovou aplikaci
Autor: GitHub Copilot
Datum: 27.7.2025
"""

from sqlalchemy import Column, Integer, String, Text, Date, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta

Base = declarative_base()


class Location(Base):
    """Lokace skladu (Mošnov, Kopřivnice)"""
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    nazev = Column(String(50), nullable=False, comment="Název lokace")
    popis = Column(Text, comment="Popis lokace")
    
    # Vztahy
    regaly = relationship("Shelf", back_populates="lokace")
    
    def __repr__(self):
        return f"<Location(nazev='{self.nazev}')>"


class Shelf(Base):
    """Regály ve skladě"""
    __tablename__ = "shelves"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    nazev = Column(String(50), nullable=False, comment="Název regálu")
    radky = Column(Integer, nullable=False, comment="Počet řádků")
    sloupce = Column(Integer, nullable=False, comment="Počet sloupců")
    typ = Column(String(20), comment="Typ regálu (hala/zkušebna)")
    
    # Vztahy
    lokace = relationship("Location", back_populates="regaly")
    pozice = relationship("Position", back_populates="regal")
    
    @property
    def celkem_pozic(self):
        """Celkový počet pozic v regálu"""
        return self.radky * self.sloupce
    
    def __repr__(self):
        return f"<Shelf(nazev='{self.nazev}', rozmer={self.radky}x{self.sloupce})>"


class Position(Base):
    """Pozice v regálu"""
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=False)
    radek = Column(Integer, nullable=False, comment="Číslo řádku")
    sloupec = Column(Integer, nullable=False, comment="Číslo sloupce")
    status = Column(String(20), default="volna", comment="Status pozice (volna/obsazena)")
    
    # Unikátní kombinace regál + řádek + sloupec
    __table_args__ = (UniqueConstraint('shelf_id', 'radek', 'sloupec', name='unique_position'),)
    
    # Vztahy
    regal = relationship("Shelf", back_populates="pozice")
    gitterbox = relationship("Gitterbox", back_populates="pozice", uselist=False)
    
    @property
    def nazev_pozice(self):
        """Lidsky čitelný název pozice podle warehouse standardu (řádek-sloupec)"""
        return f"{self.radek}-{self.sloupec}"
    
    def __repr__(self):
        return f"<Position(pozice={self.nazev_pozice}, status='{self.status}')>"


class Gitterbox(Base):
    """Hlavní kontejner - Gitterbox"""
    __tablename__ = "gitterboxes"
    
    id = Column(Integer, primary_key=True, index=True)
    cislo_gb = Column(Integer, unique=True, nullable=False, comment="Globální číslo GB (1-max_pozic)")
    position_id = Column(Integer, ForeignKey("positions.id"), nullable=False)
    zodpovedna_osoba = Column(String(100), nullable=False, comment="Zodpovědná osoba")
    datum_zalozeni = Column(Date, default=datetime.now().date(), comment="Datum založení GB")
    naplnenost_procenta = Column(Integer, default=0, comment="Naplněnost v procentech (0-100)")
    stav = Column(String(20), default="aktivni", comment="Stav GB (aktivni/vyskladnen)")
    poznamka = Column(Text, comment="Poznámka k GB")
    
    # Vztahy
    pozice = relationship("Position", back_populates="gitterbox")
    polozky = relationship("Item", back_populates="gitterbox")
    
    @property
    def pocet_polozek(self):
        """Počet aktivních položek v GB"""
        return len([p for p in self.polozky if p.stav == "aktivni"])
    
    @property
    def ma_kriticke_expirace(self):
        """Má GB nějaké položky s kritickou expirací (< 30 dní)?"""
        kriticky_datum = datetime.now().date() + timedelta(days=30)
        for polozka in self.polozky:
            if (polozka.stav == "aktivni" and 
                polozka.sledovat_expiraci and 
                polozka.expiracni_datum and 
                polozka.expiracni_datum <= kriticky_datum):
                return True
        return False
    
    @property
    def barva_indikace(self):
        """Vrací barvu pro vizualizaci regálu"""
        if self.ma_kriticke_expirace:
            return "cervena"
        
        # Kontrola typů položek
        sledovane = any(p.sledovat_expiraci for p in self.polozky if p.stav == "aktivni")
        nesledovane = any(not p.sledovat_expiraci for p in self.polozky if p.stav == "aktivni")
        
        if not sledovane and nesledovane:
            return "modra"  # Pouze nesledované
        elif sledovane:
            if self.naplnenost_procenta < 80:
                return "oranzova_srafovana"  # Neúplně naplněný
            else:
                return "oranzova"  # Plně naplněný, sledovaný
        
        return "zelena"  # Fallback
    
    def __repr__(self):
        return f"<Gitterbox(cislo={self.cislo_gb}, osoba='{self.zodpovedna_osoba}')>"


class Item(Base):
    """Položky uvnitř Gitterboxu"""
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    gitterbox_id = Column(Integer, ForeignKey("gitterboxes.id"), nullable=False)
    tma_cislo = Column(String(50), comment="TMA číslo (volitelné)")
    projekt = Column(String(100), comment="Název projektu (volitelný)")
    nazev_dilu = Column(String(200), nullable=False, comment="Název dílu/komponenty")
    pocet_kusu = Column(Integer, default=1, comment="Počet kusů")
    jednotka = Column(String(10), default="ks", comment="Jednotka (ks/kg/m/etc)")
    datum_zaskladneni = Column(Date, default=datetime.now().date(), comment="Datum zaskladnění")
    sledovat_expiraci = Column(Boolean, default=True, comment="Sledovat expiraci položky")
    expiracni_datum = Column(Date, comment="Datum expirace (automaticky +1 rok)")
    stav = Column(String(20), default="aktivni", comment="Stav položky (aktivni/vyskladnena)")
    poznamka = Column(Text, comment="Poznámka k položce")
    
    # Vztahy
    gitterbox = relationship("Gitterbox", back_populates="polozky")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Automatické nastavení expirační doby na +1 rok pokud se sleduje expirace
        if self.sledovat_expiraci and not self.expiracni_datum:
            self.expiracni_datum = self.datum_zaskladneni + timedelta(days=365)
    
    @property
    def je_blizko_expirace(self):
        """Je položka blízko expirace (< 30 dní)?"""
        if not self.sledovat_expiraci or not self.expiracni_datum:
            return False
        
        kriticky_datum = datetime.now().date() + timedelta(days=30)
        return self.expiracni_datum <= kriticky_datum
    
    @property
    def dny_do_expirace(self):
        """Počet dní do expirace"""
        if not self.sledovat_expiraci or not self.expiracni_datum:
            return None
        
        rozdil = self.expiracni_datum - datetime.now().date()
        return rozdil.days
    
    @property
    def popis_mnozstvi(self):
        """Lidsky čitelný popis množství"""
        return f"{self.pocet_kusu} {self.jednotka}"
    
    def __repr__(self):
        return f"<Item(nazev='{self.nazev_dilu}', mnozstvi={self.popis_mnozstvi})>"
