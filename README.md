# Web Service Checker

Servicio de monitoreo web completamente independiente del SO, containerizado con Docker.

## Características

- ✅ Monitoreo cada 30 minutos en condiciones normales
- 🔄 Reintentos cada 5 minutos si detecta falla
- 📧 Alerta por email después de 4 fallos consecutivos (1 + 3 reintentos)
- 🐳 Completamente containerizado - no depende del SO
- 📊 Logs detallados con timestamps
- 🔄 Recuperación automática cuando el servicio vuelve

## Uso Rápido

1. **Copiar configuración:**
   ```bash
   cp env.example .env
   ```

2. **Editar configuración en `.env`:**
   ```bash
   SERVICE_URL=https://tu-servicio.com/api/health
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-app-password
   EMAIL_FROM=monitoreo@tudominio.com
   ```

3. **Ejecutar:**
   ```bash
   docker-compose up -d
   ```

## Configuración SMTP

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```
**Importante:** Usa un "App Password", no tu contraseña normal.

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Comandos

```bash
# Iniciar el servicio
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Detener el servicio
docker-compose down

# Reiniciar
docker-compose restart

# Ver estado
docker-compose ps
```

## Funcionamiento

1. **Monitoreo Normal:** Chequea cada 30 minutos
2. **Primera Falla:** Entra en modo reintento (cada 5 min)
3. **Reintentos:** 3 adicionales cada 5 minutos
4. **Alerta:** Email después del 4º fallo consecutivo
5. **Recuperación:** Vuelve a monitoreo normal automáticamente

El email destinatario se configura en la variable `ALERT_EMAIL` del archivo `.env`.