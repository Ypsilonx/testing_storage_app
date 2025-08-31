#!/bin/bash
# Backup script pro produkční databázi

# Konfigurace
BACKUP_DIR="/opt/storage-app/backups"
DB_PATH="/opt/storage-app/backend/storage.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/storage_backup_$DATE.db"

# Vytvoření backup adresáře pokud neexistuje
mkdir -p "$BACKUP_DIR"

# Backup databáze
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_FILE"
    echo "$(date): Backup vytvořen: $BACKUP_FILE" >> "$BACKUP_DIR/backup.log"
    
    # Smazání starých backupů (starších než 30 dní)
    find "$BACKUP_DIR" -name "storage_backup_*.db" -mtime +30 -delete
    
    echo "Backup dokončen: $BACKUP_FILE"
else
    echo "CHYBA: Databáze nenalezena: $DB_PATH"
    exit 1
fi
