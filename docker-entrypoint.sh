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
chown -R shinobi:shinobi /var/lib/shinobi

# Configurar arquivo de configuração se não existir
if [ ! -f "/home/Shinobi/conf.json" ]; then
    log "Criando arquivo de configuração..."
    cp /home/Shinobi/conf.docker.json /home/Shinobi/conf.json
    
    # Substituir variáveis de ambiente no arquivo de configuração
    sed -i "s/\"password\": \"\"/\"password\": \"${DB_PASSWORD:-}\"/g" /home/Shinobi/conf.json
    sed -i "s/\"user\": \"shinobi\"/\"user\": \"${DB_USER:-shinobi}\"/g" /home/Shinobi/conf.json
    sed -i "s/\"database\": \"shinobi\"/\"database\": \"${DB_DATABASE:-shinobi}\"/g" /home/Shinobi/conf.json
    sed -i "s/\"host\": \"db\"/\"host\": \"${DB_HOST:-db}\"/g" /home/Shinobi/conf.json
    
    log "Arquivo de configuração criado e configurado"
fi

# Aguardar banco de dados ficar disponível
log "Aguardando banco de dados..."
while ! nc -z "${DB_HOST:-db}" "${DB_PORT:-3306}"; do
    log "Aguardando banco de dados em ${DB_HOST:-db}:${DB_PORT:-3306}..."
    sleep 2
done
log "Banco de dados disponível!"

# Executar migrações/inicialização do banco se necessário
if [ -f "/home/Shinobi/sql/framework.sql" ]; then
    log "Verificando se o banco precisa ser inicializado..."
    # Aqui você pode adicionar lógica para verificar e inicializar o banco
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