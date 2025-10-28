# 🚀 PRODUKČNÍ NASAZENÍ - SKLADOVÁ APLIKACE

## 📋 POŽADAVKY NA SERVER

### Minimální systémové požadavky:
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **Python**: 3.9+ (POVINNÉ - musí být nainstalováno!)
- **RAM**: 2GB minimum, 4GB doporučeno
- **Disk**: 10GB volného místa
- **CPU**: 2 cores minimum

### Síťové požadavky:
- **Port**: 8000 (nebo jiný dle konfigurace)
- **Firewall**: Port 8000 musí být otevřený
- **SSL**: Doporučeno (lze řešit přes nginx/Apache)

---

## 🔧 INSTALAČNÍ KROKY

### 1. Příprava serveru

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv git

# CentOS/RHEL
sudo yum install python3 python3-pip git

# Windows Server
# Stáhnout Python z https://python.org a nainstalovat
# Nainstalovat Git for Windows
```

### 2. Kopírování aplikace na server

```bash
# Vytvoření adresáře pro aplikaci
sudo mkdir -p /opt/storage-app
cd /opt/storage-app

# Zkopírování souborů (několik možností):

# Option A: Git clone (pokud je projekt v repozitáři)
git clone [your-repo-url] .

# Option B: SCP z lokálního počítače
scp -r /local/path/to/storage-app/* user@server:/opt/storage-app/

# Option C: Zip archiv
# - Zabaolit projekt do zip
# - Nahrát na server
# - Rozbalit: unzip storage-app.zip -d /opt/storage-app/
```

### 3. Nastavení Python prostředí

```bash
cd /opt/storage-app

# Vytvoření virtuálního prostředí
python3 -m venv venv

# Aktivace virtuálního prostředí (Linux)
source venv/bin/activate

# Windows Server
# venv\Scripts\activate

# Instalace závislostí
pip install -r requirements.txt

# Test instalace
python -c "import fastapi; print('FastAPI OK')"
```

### 4. Konfigurace prostředí

```bash
# Kopírování produkční konfigurace
cp .env.production .env

# Editace konfigurace (nahradit skutečnými hodnotami)
nano .env  # nebo vim, gedit

# DŮLEŽITÉ: Změnit tyto hodnoty!
# SECRET_KEY=generovat_silny_klíc_zde
# CORS_ORIGINS=["http://your-domain.com"]
```

### 5. Inicializace databáze

```bash
cd backend

# Aktivace prostředí
source ../venv/bin/activate

# Inicializace databáze s testovacími daty
python reset_db.py
python init_test_data.py

# Kontrola databáze
ls -la storage.db  # měl by existovat
```

### 6. Test spuštění

```bash
# Test vývojového serveru
python start_server.py

# Test produkčního serveru
python start_production.py

# V prohlížeči otevřít: http://server-ip:8000
# API dokumentace: http://server-ip:8000/api/docs
```

---

## 🔐 BEZPEČNOSTNÍ KONFIGURACE

### 1. Generování bezpečného SECRET_KEY

```python
# Spustit lokálně pro generování klíče
import secrets
print(secrets.token_urlsafe(32))
# Výsledek vložit do .env jako SECRET_KEY
```

### 2. Firewall konfigurace (Ubuntu)

```bash
# Povolení portu 8000
sudo ufw allow 8000/tcp
sudo ufw enable

# Zobrazení stavu
sudo ufw status
```

### 3. Omezení přístupu k databázi

```bash
# Nastavení práv pro databázový soubor
chmod 640 storage.db
chown app-user:app-group storage.db
```

---

## 🚀 PRODUKČNÍ NASAZENÍ

### Option A: Systemd Service (doporučeno pro Linux)

```bash
# Vytvoření systemd service
sudo nano /etc/systemd/system/storage-app.service
```

Obsah souboru:
```ini
[Unit]
Description=Storage App
After=network.target

[Service]
Type=simple
User=app-user
WorkingDirectory=/opt/storage-app/backend
Environment=PATH=/opt/storage-app/venv/bin
ExecStart=/opt/storage-app/venv/bin/python start_production.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Aktivace služby
sudo systemctl daemon-reload
sudo systemctl enable storage-app
sudo systemctl start storage-app

# Kontrola stavu
sudo systemctl status storage-app
```

### Option B: Windows Service

```cmd
# Instalace nssm (Non-Sucking Service Manager)
# Download z https://nssm.cc/

# Registrace služby
nssm install "StorageApp" "C:\path\to\venv\Scripts\python.exe"
nssm set "StorageApp" AppDirectory "C:\path\to\backend"
nssm set "StorageApp" AppParameters "start_production.py"
nssm start "StorageApp"
```

---

## 🔄 ÚDRŽBA A MONITORING

### Logy aplikace

```bash
# Zobrazení logů (systemd)
sudo journalctl -u storage-app -f

# Logy pro Windows
# Služba → Event Viewer → Applications
```

### Backup databáze

```bash
# Vytvoření zálohy
cp /opt/storage-app/backend/storage.db /backups/storage-$(date +%Y%m%d).db

# Automatizace přes cron (Linux)
echo "0 2 * * * cp /opt/storage-app/backend/storage.db /backups/storage-$(date +\%Y\%m\%d).db" | crontab -
```

### Update aplikace

```bash
# Zastavení služby
sudo systemctl stop storage-app

# Backup současné verze
cp -r /opt/storage-app /opt/storage-app-backup

# Update souborů (git pull nebo kopírování nových souborů)
cd /opt/storage-app
git pull  # nebo zkopírování nových souborů

# Update závislostí
source venv/bin/activate
pip install -r requirements.txt

# Restart služby
sudo systemctl start storage-app
```

---

## 🌐 REVERSE PROXY (doporučeno)

### Nginx konfigurace

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL certifikát (Let's Encrypt)

```bash
# Instalace certbot
sudo apt install certbot python3-certbot-nginx

# Získání certifikátu
sudo certbot --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

## ⚠️ ZNÁMÉ PROBLÉMY A ŘEŠENÍ

### 1. Port již používán
```bash
# Zjištění procesu na portu 8000
sudo lsof -i :8000
# nebo
sudo netstat -tulpn | grep :8000

# Ukončení procesu
sudo kill -9 [PID]
```

### 2. Problémy s právy
```bash
# Nastavení správných práv
sudo chown -R app-user:app-group /opt/storage-app
sudo chmod -R 755 /opt/storage-app
sudo chmod 640 /opt/storage-app/backend/storage.db
```

### 3. Python nenalezen
```bash
# Zjištění cesty k Pythonu
which python3
# Aktualizace cest v startup skriptech
```

---

## 📊 MONITORING DASHBOARD

### Základní monitoring

```bash
# CPU a RAM použití
htop

# Disk prostor
df -h

# Síťový provoz
netstat -i

# Logy aplikace
tail -f /var/log/syslog | grep storage-app
```

### Pokročilé monitoring (volitelné)

- **Prometheus + Grafana** - metriky výkonu
- **ELK Stack** - centralizované logy
- **Uptime monitoring** - sledování dostupnosti

---

## 🆘 TROUBLESHOOTING

### Nejčastější problémy:

1. **"Permission denied"** → Kontrola práv souborů
2. **"Port already in use"** → Změna portu nebo ukončení procesu
3. **"Module not found"** → Reinstalace požadavků: `pip install -r requirements.txt`
4. **Database locked** → Kontrola běžících procesů používajících DB
5. **CORS errors** → Aktualizace CORS_ORIGINS v .env

### Kontakty pro podporu:
- Aplikační logy: `journalctl -u storage-app`
- Systémové logy: `/var/log/syslog`
- API dokumentace: `http://server:8000/api/docs`

---

*Dokument vytvořen: 6.8.2025*  
*Verze: 1.0*  
*Pro aplikaci: Skladová aplikace v1.4*
