#!/bin/bash
set -e

# Script de inicialização para container Docker
echo "🚀 Iniciando Shinobi CCTV..."

# Função para logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Criar diretórios necessários
log "Criando diretórios necessários..."
mkdir -p /var/lib/shinobi/{videos,streams,logs,backup}

# Sempre recriar o arquivo de configuração para garantir que as variáveis estejam corretas
log "Configurando arquivo de configuração..."
cp /home/Shinobi/conf.docker.json /home/Shinobi/conf.json

# Substituir variáveis de ambiente no arquivo de configuração
log "Aplicando variáveis de ambiente..."
log "DB_HOST: ${DB_HOST:-db}"
log "DB_USER: ${DB_USER:-shinobi}"
log "DB_DATABASE: ${DB_DATABASE:-shinobi}"
log "DB_PORT: ${DB_PORT:-3306}"
if [ -n "$DB_PASSWORD" ]; then
    log "DB_PASSWORD: ****** (definida)"
else
    log "DB_PASSWORD: (VAZIA - ERRO!)"
fi

# Usar uma abordagem mais robusta para substituição
cat > /home/Shinobi/conf.json << EOF
{
  "port": 8080,
  "debugLog": false,
  "enableFaceManager": false,
  "videosDir": "/var/lib/shinobi/videos",
  "passwordType": "sha256",
  "detectorMergePamRegionTriggers": true,
  "wallClockTimestampAsDefault": true,
  "useBetterP2P": true,
  "smtpServerOptions": {
    "allowInsecureAuth": true
  },
  "addStorage": [
    {"name":"streams","path":"/var/lib/shinobi/streams"},
    {"name":"backup","path":"/var/lib/shinobi/backup"}
  ],
  "db": {
    "host": "${DB_HOST:-db}",
    "user": "${DB_USER:-shinobi}",
    "password": "${DB_PASSWORD:-}",
    "database": "${DB_DATABASE:-shinobi}",
    "port": ${DB_PORT:-3306},
    "type": "mysql"
  },
  "mail": {
    "service": "gmail",
    "auth": {
      "user": "",
      "pass": ""
    }
  },
  "cron": {
    "key": "fd6c7849-904d-47bd-b562-89768deea915"
  },
  "pluginKeys": {},
  "ssl": {
    "key": "",
    "cert": "",
    "enabled": false
  },
  "customAutoLoad": []
}
EOF

log "Arquivo de configuração criado com as seguintes configurações de banco:"
log "Host: ${DB_HOST:-db}"
log "User: ${DB_USER:-shinobi}"
log "Database: ${DB_DATABASE:-shinobi}"
log "Port: ${DB_PORT:-3306}"

# Configurar PM2 logs
log "Configurando logs do PM2..."
mkdir -p /var/lib/shinobi/logs
export PM2_HOME=/var/lib/shinobi/.pm2

# Iniciar aplicação
log "Iniciando aplicação Shinobi..."

# Se foi passado um comando, executar ele
if [ $# -gt 0 ]; then
    exec "$@"
else
    # Caso contrário, iniciar com PM2
    exec pm2-runtime start /home/Shinobi/pm2.yml
fi