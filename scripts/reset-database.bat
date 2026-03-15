@echo off
echo 🚀 RESET COMPLETO DE BASE DE DATOS ASTROSTAR
echo ==============================================
echo.
echo ⚠️  ADVERTENCIA: Este script eliminará TODOS los datos existentes
echo    y creará 23 deportistas con casos realistas de producción.
echo.
set /p confirm="¿Estás seguro de continuar? (y/N): "

if /i not "%confirm%"=="y" (
    echo ❌ Operación cancelada
    pause
    exit /b 1
)

echo.
echo 🔄 Iniciando reset de base de datos...
echo.

node scripts/reset-and-populate-production-data.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ ¡Reset completado exitosamente!
    echo.
    echo 🎯 PRÓXIMOS PASOS:
    echo    1. Inicia el servidor: npm run dev
    echo    2. Accede como admin: astrostar.java@gmail.com / Admin123*
    echo    3. Prueba con deportistas: [documento] / [documento]
    echo.
    echo 📋 CASOS DE PRUEBA DISPONIBLES:
    echo    • Deportistas nuevas (pago inicial)
    echo    • Deportistas activas (con mensualidades)
    echo    • Deportistas con matrícula por vencer
    echo    • Deportistas con matrícula vencida
    echo    • Deportistas inactivas
    echo    • Historial complejo de pagos
    echo.
) else (
    echo.
    echo ❌ Error durante el reset. Revisa los logs arriba.
    pause
    exit /b 1
)

pause