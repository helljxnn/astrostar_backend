#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Script de Backup Automático de Base de Datos - AstroStar
# ═══════════════════════════════════════════════════════════════
#
# INSTALACIÓN:
# 1. Dar permisos de ejecución:
#    chmod +x scripts/backup-database.sh
#
# 2. Configurar variables de entorno (ver abajo)
#
# 3. Probar manualmente:
#    ./scripts/backup-database.sh
#
# 4. Configurar cron job (ejecutar diariamente a las 2 AM):
#    crontab -e
#    0 2 * * * /ruta/completa/astrostar_backend/scripts/backup-database.sh
#
# ═══════════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────────
# CONFIGURACIÓN
# ───────────────────────────────────────────────────────────────

# Base de datos
DB_NAME="astrostar"
DB_USER="astrostar_app"
DB_HOST="localhost"
DB_PORT="5432"

# Directorio de backups (cambiar según tu servidor)
BACKUP_DIR="/var/backups/astrostar"

# Retención de backups (días)
RETENTION_DAYS=30

# Email para notificaciones (opcional)
NOTIFICATION_EMAIL="admin@astrostar.com"

# ───────────────────────────────────────────────────────────────
# NO MODIFICAR DEBAJO DE ESTA LÍNEA
# ───────────────────────────────────────────────────────────────

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Timestamp
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/astrostar_backup_$DATE.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

# Log file
LOG_FILE="$BACKUP_DIR/backup.log"

# Función para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Función para enviar notificación por email
send_notification() {
    local subject="$1"
    local message="$2"
    
    if [ ! -z "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "$subject" "$NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
}

# ───────────────────────────────────────────────────────────────
# INICIO DEL SCRIPT
# ───────────────────────────────────────────────────────────────

log "═══════════════════════════════════════════════════════════════"
log "Iniciando backup de base de datos AstroStar"
log "═══════════════════════════════════════════════════════════════"

# Verificar que el directorio de backups existe
if [ ! -d "$BACKUP_DIR" ]; then
    log "Creando directorio de backups: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    if [ $? -ne 0 ]; then
        log "${RED}ERROR: No se pudo crear el directorio de backups${NC}"
        send_notification "❌ Backup Fallido - AstroStar" "No se pudo crear el directorio de backups"
        exit 1
    fi
fi

# Verificar que pg_dump está instalado
if ! command -v pg_dump &> /dev/null; then
    log "${RED}ERROR: pg_dump no está instalado${NC}"
    send_notification "❌ Backup Fallido - AstroStar" "pg_dump no está instalado"
    exit 1
fi

# Crear backup
log "Creando backup: $BACKUP_FILE"
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    log "${GREEN}✓ Backup creado exitosamente${NC}"
    
    # Comprimir backup
    log "Comprimiendo backup..."
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "${GREEN}✓ Backup comprimido exitosamente${NC}"
        
        # Obtener tamaño del archivo
        BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        log "Tamaño del backup: $BACKUP_SIZE"
        
        # Eliminar backups antiguos
        log "Eliminando backups mayores a $RETENTION_DAYS días..."
        find "$BACKUP_DIR" -name "astrostar_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
        
        if [ $? -eq 0 ]; then
            log "${GREEN}✓ Backups antiguos eliminados${NC}"
        fi
        
        # Contar backups restantes
        BACKUP_COUNT=$(find "$BACKUP_DIR" -name "astrostar_backup_*.sql.gz" | wc -l)
        log "Backups disponibles: $BACKUP_COUNT"
        
        log "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        log "${GREEN}✓ Backup completado exitosamente${NC}"
        log "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        
        send_notification "✅ Backup Exitoso - AstroStar" "Backup completado exitosamente\nArchivo: $COMPRESSED_FILE\nTamaño: $BACKUP_SIZE\nBackups disponibles: $BACKUP_COUNT"
        
        exit 0
    else
        log "${RED}ERROR: No se pudo comprimir el backup${NC}"
        send_notification "⚠️ Backup Parcial - AstroStar" "Backup creado pero no se pudo comprimir"
        exit 1
    fi
else
    log "${RED}ERROR: No se pudo crear el backup${NC}"
    send_notification "❌ Backup Fallido - AstroStar" "No se pudo crear el backup de la base de datos"
    exit 1
fi
