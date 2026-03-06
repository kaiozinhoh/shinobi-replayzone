#!/bin/bash

# Script de deploy para EasyPanel
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se as variáveis necessárias estão definidas
check_env_vars() {
    local required_vars=(
        "EASYPANEL_API_KEY"
        "EASYPANEL_SERVER_ID" 
        "EASYPANEL_PROJECT_NAME"
        "DOCKER_REGISTRY"
        "GITHUB_REPOSITORY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Variável de ambiente $var não está definida"
            exit 1
        fi
    done
}

# Função para fazer deploy
deploy_to_easypanel() {
    local image_tag="${1:-latest}"
    local image_name="${DOCKER_REGISTRY}/${GITHUB_REPOSITORY}:${image_tag}"
    
    log "Iniciando deploy para EasyPanel..."
    log "Imagem: $image_name"
    log "Projeto: $EASYPANEL_PROJECT_NAME"
    
    # Payload para a API do EasyPanel
    local payload=$(cat <<EOF
{
    "image": "$image_name",
    "project": "$EASYPANEL_PROJECT_NAME",
    "tag": "$image_tag",
    "environment": {
        "NODE_ENV": "production",
        "DB_HOST": "shinobi-db",
        "DB_USER": "shinobi",
        "DB_PASSWORD": "\${DB_PASSWORD}",
        "DB_DATABASE": "shinobi",
        "DB_PORT": "3306",
        "DB_TYPE": "mysql"
    }
}
EOF
    )
    
    # Fazer a requisição para a API do EasyPanel
    local response=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $EASYPANEL_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "https://api.easypanel.io/servers/$EASYPANEL_SERVER_ID/deploy")
    
    local http_code="${response: -3}"
    local response_body="${response%???}"
    
    if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
        success "Deploy realizado com sucesso!"
        log "Resposta da API: $response_body"
    else
        error "Falha no deploy. Código HTTP: $http_code"
        error "Resposta: $response_body"
        exit 1
    fi
}

# Função para verificar status do deployment
check_deployment_status() {
    log "Verificando status do deployment..."
    
    local response=$(curl -s -w "%{http_code}" \
        -H "Authorization: Bearer $EASYPANEL_API_KEY" \
        "https://api.easypanel.io/servers/$EASYPANEL_SERVER_ID/projects/$EASYPANEL_PROJECT_NAME/status")
    
    local http_code="${response: -3}"
    local response_body="${response%???}"
    
    if [[ "$http_code" == "200" ]]; then
        log "Status do projeto: $response_body"
    else
        warning "Não foi possível verificar o status. Código HTTP: $http_code"
    fi
}

# Função para rollback
rollback() {
    local previous_tag="${1:-previous}"
    warning "Iniciando rollback para tag: $previous_tag"
    deploy_to_easypanel "$previous_tag"
}

# Função principal
main() {
    local command="${1:-deploy}"
    local tag="${2:-latest}"
    
    case "$command" in
        "deploy")
            check_env_vars
            deploy_to_easypanel "$tag"
            sleep 10  # Aguardar um pouco antes de verificar status
            check_deployment_status
            ;;
        "status")
            check_env_vars
            check_deployment_status
            ;;
        "rollback")
            check_env_vars
            rollback "$tag"
            ;;
        *)
            echo "Uso: $0 {deploy|status|rollback} [tag]"
            echo "  deploy [tag]    - Faz deploy da imagem com a tag especificada (padrão: latest)"
            echo "  status          - Verifica o status do deployment"
            echo "  rollback [tag]  - Faz rollback para a tag especificada (padrão: previous)"
            exit 1
            ;;
    esac
}

# Executar função principal com os argumentos passados
main "$@"