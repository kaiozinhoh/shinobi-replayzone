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

# Configurar arquivo de configuração se não existir
if [ ! -f "/home/Shinobi/conf.json" ]; then
    log "Criando arquivo de configuração..."
    cp /home/Shinobi/conf.docker.json /home/Shinobi/conf.json
    
    # Substituir variáveis de ambiente no arquivo de configuração
    sed -i "s/\"password\": \"\"/\"password\": \"${DB_PASSWORD:-}\"/g" /home/Shinobi/conf.json
    sed -i "s/\"user\": \"shinobi\"/\"user\": \"${DB_USER:-shinobi}\"/g" /home/Shinobi/conf.json
    sed -i "s/\"database\": \"shinobi\"/\"database\": \"${DB_DATABASE:-shinobi}\"/g" /home/Shinobi/conf.json
    sed -i "s/\"host\": \"db\"/\"host\": \"${DB_HOST:-db}\"/g" /home/Shinobi/conf.json
    sed -i "s/\"port\": 3306/\"port\": ${DB_PORT:-3306}/g" /home/Shinobi/conf.json
    
    log "Arquivo de configuração criado e configurado"
fi

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