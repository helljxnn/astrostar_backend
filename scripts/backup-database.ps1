# ═══════════════════════════════════════════════════════════════
# Script de Backup Automático de Base de Datos - AstroStar (Windows)
# ═══════════════════════════════════════════════════════════════
#
# INSTALACIÓN:
# 1. Configurar variables de entorno (ver abajo)
#
# 2. Probar manualmente:
#    .\scripts\backup-database.ps1
#
# 3. Configurar tarea programada (Task Scheduler):
#    - Abrir Task Scheduler
#    - Crear tarea básica
#    - Trigger: Diario a las 2:00 AM
#    - Action: Iniciar programa
#      Program: powershell.exe
#      Arguments: -ExecutionPolicy Bypass -File "C:\ruta\completa\backup-database.ps1"
#
# ═══════════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────────
# CONFIGURACIÓN
# ───────────────────────────────────────────────────────────────

$DB_NAME = "astrostar"
$DB_USER = "astrostar_app"
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_PASSWORD = $env:DB_PASSWORD # Configurar en variables de entorno del sistema

# Directorio de backups
$BACKUP_DIR = "C:\backups\astrostar"

# Retención de backups (días)
$RETENTION_DAYS = 30

# Ruta a pg_dump (ajustar según instalación de PostgreSQL)
$PG_DUMP = "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe"

# ───────────────────────────────────────────────────────────────
# NO MODIFICAR DEBAJO DE ESTA LÍNEA
# ───────────────────────────────────────────────────────────────

# Timestamp
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\astrostar_backup_$DATE.sql"
$COMPRESSED_FILE = "$BACKUP_FILE.zip"

# Log file
$LOG_FILE = "$BACKUP_DIR\backup.log"

# Función para logging
function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $LOG_FILE -Value $logMessage
}

# ───────────────────────────────────────────────────────────────
# INICIO DEL SCRIPT
# ───────────────────────────────────────────────────────────────

Write-Log "═══════════════════════════════════════════════════════════════"
Write-Log "Iniciando backup de base de datos AstroStar"
Write-Log "═══════════════════════════════════════════════════════════════"

# Verificar que el directorio de backups existe
if (-not (Test-Path $BACKUP_DIR)) {
    Write-Log "Creando directorio de backups: $BACKUP_DIR"
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
}

# Verificar que pg_dump existe
if (-not (Test-Path $PG_DUMP)) {
    Write-Log "ERROR: pg_dump no encontrado en $PG_DUMP"
    Write-Log "Por favor ajustar la ruta en el script"
    exit 1
}

# Verificar que la contraseña está configurada
if ([string]::IsNullOrEmpty($DB_PASSWORD)) {
    Write-Log "ERROR: DB_PASSWORD no está configurada"
    Write-Log "Configurar variable de entorno DB_PASSWORD"
    exit 1
}

# Configurar variable de entorno para pg_dump
$env:PGPASSWORD = $DB_PASSWORD

try {
    # Crear backup
    Write-Log "Creando backup: $BACKUP_FILE"
    
    & $PG_DUMP -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f $BACKUP_FILE
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✓ Backup creado exitosamente"
        
        # Comprimir backup
        Write-Log "Comprimiendo backup..."
        Compress-Archive -Path $BACKUP_FILE -DestinationPath $COMPRESSED_FILE -Force
        
        # Eliminar archivo sin comprimir
        Remove-Item $BACKUP_FILE
        
        # Obtener tamaño del archivo
        $fileSize = (Get-Item $COMPRESSED_FILE).Length / 1MB
        $fileSizeFormatted = "{0:N2} MB" -f $fileSize
        Write-Log "Tamaño del backup: $fileSizeFormatted"
        
        # Eliminar backups antiguos
        Write-Log "Eliminando backups mayores a $RETENTION_DAYS días..."
        $cutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)
        Get-ChildItem -Path $BACKUP_DIR -Filter "astrostar_backup_*.zip" | 
            Where-Object { $_.LastWriteTime -lt $cutoffDate } | 
            Remove-Item -Force
        
        # Contar backups restantes
        $backupCount = (Get-ChildItem -Path $BACKUP_DIR -Filter "astrostar_backup_*.zip").Count
        Write-Log "Backups disponibles: $backupCount"
        
        Write-Log "═══════════════════════════════════════════════════════════════"
        Write-Log "✓ Backup completado exitosamente"
        Write-Log "═══════════════════════════════════════════════════════════════"
        
        exit 0
    }
    else {
        Write-Log "ERROR: No se pudo crear el backup"
        exit 1
    }
}
catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    exit 1
}
finally {
    # Limpiar variable de entorno
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
