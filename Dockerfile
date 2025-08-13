FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY index.js ./

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambiar al usuario no-root
USER nodejs

# Healthcheck para Docker
HEALTHCHECK --interval=5m --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "console.log('Container is running')" || exit 1

# Comando por defecto
CMD ["npm", "start"]