# Configuración del Servicio de Email - AstroStar

## Descripción
El sistema AstroStar envía automáticamente credenciales de acceso por email cuando se crea un nuevo empleado. Este documento explica cómo configurar el servicio de email.

## Configuración para Gmail (Recomendado para Desarrollo)

### 1. Preparar tu cuenta de Gmail

1. **Habilitar verificación en 2 pasos:**
   - Ve a [myaccount.google.com](https://myaccount.google.com)
   - Selecciona "Seguridad" → "Verificación en 2 pasos"
   - Sigue las instrucciones para habilitarla

2. **Generar contraseña de aplicación:**
   - En la misma sección de "Seguridad"
   - Busca "Contraseñas de aplicaciones"
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Escribe "AstroStar" como nombre
   - Copia la contraseña generada (16 caracteres)

### 2. Configurar variables de entorno

Edita el archivo `.env` en la raíz del backend:

```env
# Configuración de Email
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion-de-16-caracteres
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# URLs del Frontend
FRONTEND_URL=http://localhost:3000

# Entorno
NODE_ENV=development
```

### 3. Ejemplo de configuración completa

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/astrostar?schema=public"

# Servidor
PORT=4000

# Email (Gmail)
EMAIL_USER=astrostar.sistema@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Frontend
FRONTEND_URL=http://localhost:3000

# Entorno
NODE_ENV=development
```

## Configuración para otros proveedores

### Outlook/Hotmail
```env
EMAIL_USER=tu-email@outlook.com
EMAIL_PASSWORD=tu-contraseña
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo Mail
```env
EMAIL_USER=tu-email@yahoo.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### SMTP Personalizado
```env
EMAIL_USER=tu-email@tudominio.com
EMAIL_PASSWORD=tu-contraseña
SMTP_HOST=mail.tudominio.com
SMTP_PORT=587
```

## Modo Simulación

Si no configuras las credenciales de email, el sistema funcionará en **modo simulación**:

- ✅ Los empleados se crean normalmente
- ✅ Las contraseñas se generan correctamente
- 📧 Los emails se "simulan" (se muestran en la consola del servidor)
- ⚠️ No se envían emails reales

### Logs en modo simulación:
```
📧 [SIMULADO] Email de bienvenida enviado:
   Para: empleado@ejemplo.com
   Asunto: 🎉 Bienvenido a AstroStar - Credenciales de Acceso
   Credenciales: empleado@ejemplo.com / Abc123def!
```

## Probar la configuración

### 1. Verificar estado del servicio
```bash
GET http://localhost:4000/api/test/email/verify
```

### 2. Enviar email de prueba
```bash
POST http://localhost:4000/api/test/email
Content-Type: application/json

{
  "email": "tu-email@ejemplo.com",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

## Solución de problemas

### Error: "Invalid login"
- ✅ Verifica que la verificación en 2 pasos esté habilitada
- ✅ Usa una contraseña de aplicación, no tu contraseña normal
- ✅ Verifica que el email sea correcto

### Error: "Connection timeout"
- ✅ Verifica tu conexión a internet
- ✅ Algunos firewalls bloquean el puerto 587
- ✅ Intenta con puerto 465 (secure: true)

### Error: "Authentication failed"
- ✅ Regenera la contraseña de aplicación
- ✅ Verifica que no haya espacios extra en las variables de entorno

### Los emails van a spam
- ✅ Configura SPF/DKIM en tu dominio (para producción)
- ✅ Usa un servicio profesional como SendGrid o AWS SES
- ✅ Pide a los usuarios que agreguen tu email a contactos

## Producción

Para producción, se recomienda usar servicios especializados:

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=tu-api-key-de-sendgrid
```

### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
EMAIL_USER=tu-access-key-id
EMAIL_PASSWORD=tu-secret-access-key
```

## Seguridad

- 🔒 Nunca commits las credenciales reales al repositorio
- 🔒 Usa variables de entorno para todas las configuraciones sensibles
- 🔒 Regenera las contraseñas de aplicación periódicamente
- 🔒 Monitorea los logs de envío de emails
- 🔒 Implementa rate limiting para prevenir spam