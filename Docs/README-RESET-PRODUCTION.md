# 🚀 RESET DE BASE DE DATOS CON DATOS DE PRODUCCIÓN

Este script limpia completamente la base de datos y la puebla con **23 deportistas** que cubren todos los casos realistas que pueden ocurrir en producción.

## 📋 **CASOS INCLUIDOS**

### **🆕 Deportistas Nuevas (3)**
- Matrícula en estado `Pending_Payment`
- Obligación `ENROLLMENT_INITIAL` pendiente
- Sin historial de pagos
- Algunas menores con acudiente

### **✅ Deportistas Activas (5)**
- Matrícula en estado `Vigente`
- Historial de pagos al día
- Mensualidades generadas y pagadas
- Diferentes antigüedades (2023-2024)

### **⏰ Matrícula por Vencer (4)**
- Matrícula vigente pero próxima a vencer (30 días)
- Historial completo de pagos
- Algunas con mensualidades en mora

### **❌ Matrícula Vencida (4)**
- Estado `Vencida` - requiere renovación
- Obligación `ENROLLMENT_RENEWAL` generada
- Acceso restringido hasta renovación

### **💤 Deportistas Inactivas (3)**
- Estado `Inactive` con diferentes razones:
  - Cambio de ciudad
  - Problemas de salud  
  - Falta de tiempo por estudios

### **🎓 Mayores de Edad (2)**
- Sin acudiente requerido
- Matrícula vigente
- Historial normal de pagos

### **📚 Historial Complejo (2)**
- Múltiples renovaciones de matrícula
- Historial extenso de pagos
- Casos de deportistas veteranas

## 🎯 **DATOS COMPLETOS**

Cada deportista incluye:
- ✅ **Datos personales completos** (nombres femeninos reales)
- ✅ **Edades variadas** (10-20 años)
- ✅ **Acudientes para menores** (con relación familiar)
- ✅ **Direcciones realistas** de Bogotá
- ✅ **Emails y teléfonos** generados
- ✅ **Inscripciones deportivas** según edad
- ✅ **Historial de matrículas** completo
- ✅ **Obligaciones de pago** según estado
- ✅ **Pagos aprobados/pendientes** realistas

## 🚀 **CÓMO EJECUTAR**

### **Opción 1: Comando NPM (Recomendado)**
```bash
npm run db:reset-production
```

### **Opción 2: Script directo**
```bash
node scripts/reset-and-populate-production-data.js
```

### **Opción 3: Script con interfaz (Windows)**
```bash
scripts/reset-database.bat
```

### **Opción 4: Script bash (Linux/Mac)**
```bash
./scripts/reset-database.sh
```

## ⚠️ **ADVERTENCIAS**

- **ELIMINA TODOS LOS DATOS EXISTENTES**
- **NO REVERSIBLE** - asegúrate de tener backup si es necesario
- **Solo para desarrollo/testing** - no usar en producción real

## 🔑 **CREDENCIALES DE ACCESO**

### **Administrador**
- **Email:** `astrostar.java@gmail.com`
- **Contraseña:** `Admin123*`

### **Deportistas**
- **Email:** `[nombre].[apellido]@[dominio].com`
- **Contraseña:** `[número_documento]`

**Ejemplo:**
- Email: `maria.garcia@gmail.com`
- Contraseña: `1000000001`

## 📊 **ESTADÍSTICAS GENERADAS**

El script genera aproximadamente:
- **24 usuarios** (1 admin + 23 deportistas)
- **23 deportistas** con casos variados
- **15+ acudientes** para menores
- **30+ matrículas** (incluyendo historial)
- **50+ obligaciones** de pago
- **40+ pagos** registrados
- **23 inscripciones** deportivas

## 🧪 **CASOS DE PRUEBA**

Después de ejecutar el script, puedes probar:

1. **Login como deportista nueva** → Debe ir a "Mis Pagos"
2. **Subir comprobante** de matrícula inicial
3. **Login como admin** → Revisar pagos pendientes
4. **Aprobar pago** → Verificar activación automática
5. **Deportista con mora** → Ver cálculo de mora
6. **Matrícula vencida** → Proceso de renovación
7. **Deportista inactiva** → Acceso restringido

## 🔧 **CONFIGURACIÓN INCLUIDA**

- **Tipos de documento** (8 tipos)
- **Roles** (Administrador, Deportista)
- **Categorías deportivas** (Infantil, PreJuvenil, Juvenil)
- **Configuración de pagos** (montos y mora)
- **Permisos dinámicos** configurados

## 📝 **LOGS Y DEBUG**

El script muestra progreso detallado:
- ✅ Limpieza de base de datos
- ✅ Creación de datos maestros
- ✅ Generación de deportistas
- ✅ Creación de acudientes
- ✅ Matrículas y pagos
- ✅ Estadísticas finales

## 🎉 **RESULTADO**

Al finalizar tendrás un sistema completamente funcional con:
- Todos los casos de producción cubiertos
- Datos realistas y consistentes
- Historial completo de transacciones
- Sistema listo para pruebas exhaustivas

**¡Perfecto para demostrar el sistema funcionando al 100%!** 🚀