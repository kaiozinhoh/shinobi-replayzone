#!/bin/bash

# Script de configuração inicial do Shinobi
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
   _____ __    _            __    _ 
  / ___// /_  (_)___  ____  / /_  (_)
  \__ \/ __ \/ / __ \/ __ \/ __ \/ / 
 ___/ / / / / / / / / /_/ / /_/ / /  
/____/_/ /_/_/_/ /_/\____/_.___/_/   
                                    
Setup Script - CCTV & NVR System
EOF
echo -e "${NC}"

# Verificar se estamos no diretório correto
if [[ ! -f "package.json" ]]; then
    error "Execute este script na raiz do projeto Shinobi"
    exit 1
fi

log "Iniciando configuração do Shinobi..."

# 1. Verificar dependências
check_dependencies() {
    log "Verificando dependências..."
    
    local deps=("docker" "docker-compose" "git" "curl")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        error "Dependências não encontradas: ${missing_deps[*]}"
        log "Instale as dependências e execute novamente"
        exit 1
    fi
    
    success "Todas as dependências encontradas"
}

# 2. Configurar arquivos de ambiente
setup_env_files() {
    log "Configurando arquivos de ambiente..."
    
    if [[ ! -f ".env" ]]; then
        cp .env.example .env
        success "Arquivo .env criado a partir do .env.example"
        warning "IMPORTANTE: Edite o arquivo .env com suas configurações"
    else
        warning "Arquivo .env já existe, pulando..."
    fi
    
    if [[ ! -f ".easypanel.env.local" ]]; then
        cp .easypanel.env .easypanel.env.local
        success "Arquivo .easypanel.env.local criado"
        warning "IMPORTANTE: Configure suas credenciais do EasyPanel em .easypanel.env.local"
    else
        warning "Arquivo .easypanel.env.local já existe, pulando..."
    fi
}

# 3. Gerar senhas seguras
generate_passwords() {
    log "Gerando senhas seguras..."
    
    local db_password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    local root_password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Atualizar .env com senhas geradas
    sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" .env
    sed -i.bak "s/DB_ROOT_PASSWORD=.*/DB_ROOT_PASSWORD=$root_password/" .env
    
    success "Senhas seguras geradas e configuradas no .env"
    log "DB_PASSWORD: $db_password"
    log "DB_ROOT_PASSWORD: $root_password"
    warning "Guarde essas senhas em local seguro!"
}

# 4. Configurar permissões
setup_permissions() {
    log "Configurando permissões..."
    
    chmod +x scripts/*.sh
    success "Permissões configuradas para scripts"
}

# 5. Inicializar banco de dados
init_database() {
    log "Inicializando banco de dados..."
    
    # Verificar se o banco já está rodando
    if docker-compose ps db | grep -q "Up"; then
        warning "Banco de dados já está rodando"
        return
    fi
    
    # Iniciar apenas o banco de dados
    docker-compose up -d db
    
    # Aguardar o banco ficar pronto
    log "Aguardando banco de dados ficar pronto..."
    local attempts=0
    local max_attempts=30
    
    while [[ $attempts -lt $max_attempts ]]; do
        if docker-compose exec -T db mysqladmin ping -h localhost --silent; then
            success "Banco de dados está pronto!"
            break
        fi
        
        attempts=$((attempts + 1))
        log "Tentativa $attempts/$max_attempts..."
        sleep 2
    done
    
    if [[ $attempts -eq $max_attempts ]]; then
        error "Timeout aguardando banco de dados"
        exit 1
    fi
}

# 6. Configurar Git (se necessário)
setup_git() {
    log "Configurando Git..."
    
    # Verificar se é um repositório Git
    if [[ ! -d ".git" ]]; then
        log "Inicializando repositório Git..."
        git init
        git add .
        git commit -m "Initial commit - Shinobi CCTV setup"
        success "Repositório Git inicializado"
    else
        log "Repositório Git já existe"
    fi
    
    # Verificar remote origin
    if ! git remote get-url origin &> /dev/null; then
        warning "Configure o remote origin do Git:"
        warning "git remote add origin https://github.com/SEU-USUARIO/shinobi.git"
    fi
}

# 7. Testar configuração
test_setup() {
    log "Testando configuração..."
    
    # Build da imagem
    log "Fazendo build da imagem Docker..."
    docker-compose build
    
    # Iniciar serviços
    log "Iniciando serviços..."
    docker-compose up -d
    
    # Aguardar aplicação ficar pronta
    log "Aguardando aplicação ficar pronta..."
    local attempts=0
    local max_attempts=30
    
    while [[ $attempts -lt $max_attempts ]]; do
        if curl -f http://localhost:8080/health &> /dev/null; then
            success "Aplicação está rodando!"
            break
        fi
        
        attempts=$((attempts + 1))
        log "Tentativa $attempts/$max_attempts..."
        sleep 3
    done
    
    if [[ $attempts -eq $max_attempts ]]; then
        warning "Aplicação pode não estar totalmente pronta"
        log "Verifique os logs: docker-compose logs -f shinobi"
    fi
}

# Função principal
main() {
    log "=== Configuração do Shinobi CCTV ==="
    
    check_dependencies
    setup_env_files
    generate_passwords
    setup_permissions
    init_database
    setup_git
    test_setup
    
    echo
    success "=== Configuração concluída! ==="
    echo
    log "Próximos passos:"
    log "1. Edite o arquivo .env com suas configurações específicas"
    log "2. Configure .easypanel.env.local com suas credenciais do EasyPanel"
    log "3. Configure os secrets no GitHub (se usando CI/CD)"
    log "4. Acesse http://localhost:8080 para configurar o Shinobi"
    echo
    log "Comandos úteis:"
    log "- Ver logs: docker-compose logs -f"
    log "- Parar serviços: docker-compose down"
    log "- Deploy EasyPanel: ./scripts/deploy-easypanel.sh deploy"
    echo
    warning "IMPORTANTE: Altere as senhas padrão na primeira configuração!"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi