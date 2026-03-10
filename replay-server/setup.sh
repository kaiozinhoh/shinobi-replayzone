#!/bin/bash

# 🚀 Script de Setup do Replay Server
# Este script configura o ambiente para desenvolvimento e produção

set -e

echo "🎬 Configurando Replay Server..."
echo "================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se o Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado!"
        echo "Por favor, instale o Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker encontrado"
}

# Verificar se o Docker Compose está instalado
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose não encontrado, tentando usar 'docker compose'"
        if ! docker compose version &> /dev/null; then
            print_error "Docker Compose não está disponível!"
            echo "Por favor, instale o Docker Compose: https://docs.docker.com/compose/install/"
            exit 1
        fi
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    print_success "Docker Compose encontrado"
}

# Criar arquivo .env se não existir
setup_env() {
    if [ ! -f .env ]; then
        print_status "Criando arquivo .env..."
        cp .env.example .env
        print_success "Arquivo .env criado"
        print_warning "Por favor, edite o arquivo .env com suas configurações antes de continuar"
        
        # Perguntar se o usuário quer editar agora
        read -p "Deseja editar o arquivo .env agora? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        print_success "Arquivo .env já existe"
    fi
}

# Criar diretórios necessários
create_directories() {
    print_status "Criando diretórios necessários..."
    
    mkdir -p temp
    mkdir -p hls
    mkdir -p dev-videos/shinobi
    mkdir -p dev-videos/ftp
    
    print_success "Diretórios criados"
}

# Instalar dependências Node.js
install_dependencies() {
    if [ -f package.json ]; then
        print_status "Instalando dependências Node.js..."
        npm install
        print_success "Dependências instaladas"
    fi
}

# Build da imagem Docker
build_docker() {
    print_status "Construindo imagem Docker..."
    docker build -t replay-server .
    print_success "Imagem Docker construída"
}

# Função principal
main() {
    echo "Escolha uma opção:"
    echo "1) Setup completo (desenvolvimento)"
    echo "2) Setup para produção"
    echo "3) Apenas criar .env"
    echo "4) Build Docker"
    echo "5) Iniciar desenvolvimento"
    echo "6) Iniciar produção"
    echo "7) Parar serviços"
    
    read -p "Digite sua escolha (1-7): " choice
    
    case $choice in
        1)
            print_status "Iniciando setup completo para desenvolvimento..."
            check_docker
            check_docker_compose
            setup_env
            create_directories
            install_dependencies
            build_docker
            print_success "Setup completo! Use './setup.sh' e escolha opção 5 para iniciar"
            ;;
        2)
            print_status "Iniciando setup para produção..."
            check_docker
            check_docker_compose
            setup_env
            create_directories
            build_docker
            print_success "Setup para produção completo! Use './setup.sh' e escolha opção 6 para iniciar"
            ;;
        3)
            setup_env
            ;;
        4)
            check_docker
            build_docker
            ;;
        5)
            print_status "Iniciando ambiente de desenvolvimento..."
            check_docker
            check_docker_compose
            $DOCKER_COMPOSE -f docker-compose.dev.yml up -d
            print_success "Ambiente de desenvolvimento iniciado!"
            echo "Acesse: http://localhost:3010"
            echo "Health check: http://localhost:3010/health"
            echo "Para ver logs: $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f"
            ;;
        6)
            print_status "Iniciando ambiente de produção..."
            check_docker
            check_docker_compose
            $DOCKER_COMPOSE up -d
            print_success "Ambiente de produção iniciado!"
            echo "Acesse: http://localhost:3010"
            echo "Health check: http://localhost:3010/health"
            echo "Para ver logs: $DOCKER_COMPOSE logs -f"
            ;;
        7)
            print_status "Parando serviços..."
            check_docker_compose
            $DOCKER_COMPOSE down
            $DOCKER_COMPOSE -f docker-compose.dev.yml down 2>/dev/null || true
            print_success "Serviços parados"
            ;;
        *)
            print_error "Opção inválida"
            exit 1
            ;;
    esac
}

# Verificar se está sendo executado como script principal
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi