# Multi-stage build para otimizar tamanho da imagem
FROM node:18-bookworm-slim as builder

# Instalar dependências de build
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    pkg-config \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependências do Shinobi (raiz)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Instalar dependências do replay-server em estágio de build
WORKDIR /app/replay-server
COPY replay-server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Imagem final
FROM node:18-bookworm-slim

# Argumentos de build
ARG DEBIAN_FRONTEND=noninteractive

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    DB_USER=majesticflame \
    DB_PASSWORD='' \
    DB_HOST=localhost \
    DB_DATABASE=ccio \
    DB_PORT=3306 \
    DB_TYPE=mysql \
    SUBSCRIPTION_ID=sub_XXXXXXXXXXXX \
    PLUGIN_KEYS='{}' \
    SSL_ENABLED=false \
    SSL_COUNTRY=CA \
    SSL_STATE=BC \
    SSL_LOCATION=Vancouver \
    SSL_ORGANIZATION='Shinobi Systems' \
    SSL_ORGANIZATION_UNIT='IT Department' \
    SSL_COMMON_NAME='nvr.ninja' \
    SHINOBI_PORT=8080

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    curl \
    net-tools \
    netcat-openbsd \
    nginx \
    sudo \
    procps \
    coreutils \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Instalar PM2 globalmente
RUN npm install -g pm2

# Criar usuário não-root
RUN groupadd -r shinobi && useradd -r -g shinobi shinobi

# Criar diretórios necessários
RUN mkdir -p /home/Shinobi \
    /var/lib/shinobi/videos \
    /var/lib/shinobi/streams \
    /var/www/replay-videos \
    /app/hls \
    /app/temp \
    && chown -R shinobi:shinobi /home/Shinobi /var/lib/shinobi /var/www/replay-videos /app/hls /app/temp

WORKDIR /home/Shinobi

# Copiar node_modules do builder (Shinobi)
COPY --from=builder /app/node_modules ./node_modules

# Copiar node_modules do replay-server
RUN mkdir -p replay-server
COPY --from=builder /app/replay-server/node_modules ./replay-server/node_modules

# Copiar código da aplicação (Shinobi + replay-server)
COPY --chown=shinobi:shinobi . .

# Copiar configuração PM2 otimizada
COPY --chown=shinobi:shinobi Docker/pm2.prod.yml ./pm2.yml

# Copiar e configurar entrypoint personalizado
COPY --chown=shinobi:shinobi docker-entrypoint.sh /usr/local/bin/
COPY --chown=shinobi:shinobi wait-for-db.sh /usr/local/bin/
COPY --chown=shinobi:shinobi conf.docker.json ./
COPY nginx-replay.conf /etc/nginx/conf.d/replay.conf

# Dar permissões necessárias
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/wait-for-db.sh && \
    chmod +x Docker/init.sh && \
    chmod -R 755 plugins && \
    sed -i -e 's/\r//g' Docker/init.sh && \
    sed -i -e 's/\r//g' /usr/local/bin/docker-entrypoint.sh && \
    sed -i -e 's/\r//g' /usr/local/bin/wait-for-db.sh && \
    rm -f /etc/nginx/sites-enabled/default

# Criar volumes para dados persistentes
VOLUME ["/var/lib/shinobi"]

# Expor portas
EXPOSE 8080 3010 8081

# Rodar como root para permitir correção de permissões
# (bind mount do host, ex: EasyPanel, pode sobrescrever chown do build)
USER root

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/ || wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Comando de inicialização
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pm2-runtime", "start", "pm2.yml"]