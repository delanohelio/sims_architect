# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifestos de dependência primeiro para cache de camadas
COPY package.json package-lock.json ./

# Instalar dependências (ci para builds reproduzíveis)
RUN npm ci

# Copiar o restante do código-fonte
COPY . .

# Build de produção (tsc + vite build → /app/dist)
RUN npm run build

# ============================================
# Stage 2: Servir com Nginx
# ============================================
FROM nginx:stable-alpine AS production

# Remover config default do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefatos do build
COPY --from=builder /app/dist /usr/share/nginx/html

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 8080

# Healthcheck para orquestração
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
