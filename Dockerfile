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
COPY package*.json ./
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
    sudo \
    procps \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# Instalar PM2 globalmente
RUN npm install -g pm2

# Criar usuário não-root
RUN groupadd -r shinobi && useradd -r -g shinobi shinobi

# Criar diretórios necessários
RUN mkdir -p /home/Shinobi /var/lib/shinobi/videos /var/lib/shinobi/streams \
    && chown -R shinobi:shinobi /home/Shinobi /var/lib/shinobi

WORKDIR /home/Shinobi

# Copiar node_modules do builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --chown=shinobi:shinobi . .

# Copiar configuração PM2 otimizada
COPY --chown=shinobi:shinobi Docker/pm2.prod.yml ./pm2.yml

# Copiar e configurar entrypoint personalizado
COPY --chown=shinobi:shinobi docker-entrypoint.sh /usr/local/bin/
COPY --chown=shinobi:shinobi conf.docker.json ./

# Dar permissões necessárias
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chmod +x Docker/init.sh && \
    chmod -R 755 plugins && \
    sed -i -e 's/\r//g' Docker/init.sh && \
    sed -i -e 's/\r//g' /usr/local/bin/docker-entrypoint.sh

# Criar volumes para dados persistentes
VOLUME ["/var/lib/shinobi"]

# Expor portas
EXPOSE 8080

# Usar usuário não-root
USER shinobi

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Comando de inicialização
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pm2-runtime", "start", "pm2.yml"]