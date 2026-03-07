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

# Usar script Node.js para configuração robusta
log "Configurando arquivo de configuração com script Node.js..."
node /home/Shinobi/fix-config.js

# Garantir que mysql2 está disponível
log "Verificando drivers MySQL..."
if ! node -e "require('mysql2')" 2>/dev/null; then
    log "Instalando mysql2..."
    npm install mysql2 --save
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