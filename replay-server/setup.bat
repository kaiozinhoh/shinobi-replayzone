@echo off
setlocal enabledelayedexpansion

:: 🚀 Script de Setup do Replay Server para Windows
:: Este script configura o ambiente para desenvolvimento e produção

echo 🎬 Configurando Replay Server...
echo ================================

:: Verificar se o Docker está instalado
:check_docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker não está instalado!
    echo Por favor, instale o Docker: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)
echo [SUCCESS] Docker encontrado

:: Verificar se o Docker Compose está instalado
:check_docker_compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Docker Compose não encontrado, tentando usar 'docker compose'
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker Compose não está disponível!
        echo Por favor, instale o Docker Compose: https://docs.docker.com/compose/install/
        pause
        exit /b 1
    )
    set DOCKER_COMPOSE=docker compose
) else (
    set DOCKER_COMPOSE=docker-compose
)
echo [SUCCESS] Docker Compose encontrado

:: Menu principal
:main_menu
echo.
echo Escolha uma opção:
echo 1) Setup completo (desenvolvimento)
echo 2) Setup para produção
echo 3) Apenas criar .env
echo 4) Build Docker
echo 5) Iniciar desenvolvimento
echo 6) Iniciar produção
echo 7) Parar serviços
echo 8) Sair
echo.

set /p choice="Digite sua escolha (1-8): "

if "%choice%"=="1" goto setup_dev
if "%choice%"=="2" goto setup_prod
if "%choice%"=="3" goto setup_env
if "%choice%"=="4" goto build_docker
if "%choice%"=="5" goto start_dev
if "%choice%"=="6" goto start_prod
if "%choice%"=="7" goto stop_services
if "%choice%"=="8" goto end
echo [ERROR] Opção inválida
goto main_menu

:setup_dev
echo [INFO] Iniciando setup completo para desenvolvimento...
call :setup_env
call :create_directories
call :install_dependencies
call :build_docker
echo [SUCCESS] Setup completo! Use este script e escolha opção 5 para iniciar
goto main_menu

:setup_prod
echo [INFO] Iniciando setup para produção...
call :setup_env
call :create_directories
call :build_docker
echo [SUCCESS] Setup para produção completo! Use este script e escolha opção 6 para iniciar
goto main_menu

:setup_env
if not exist .env (
    echo [INFO] Criando arquivo .env...
    copy .env.example .env >nul
    echo [SUCCESS] Arquivo .env criado
    echo [WARNING] Por favor, edite o arquivo .env com suas configurações antes de continuar
    
    set /p edit_env="Deseja editar o arquivo .env agora? (y/n): "
    if /i "!edit_env!"=="y" (
        notepad .env
    )
) else (
    echo [SUCCESS] Arquivo .env já existe
)
goto :eof

:create_directories
echo [INFO] Criando diretórios necessários...
if not exist temp mkdir temp
if not exist hls mkdir hls
if not exist dev-videos mkdir dev-videos
if not exist dev-videos\shinobi mkdir dev-videos\shinobi
if not exist dev-videos\ftp mkdir dev-videos\ftp
echo [SUCCESS] Diretórios criados
goto :eof

:install_dependencies
if exist package.json (
    echo [INFO] Instalando dependências Node.js...
    npm install
    echo [SUCCESS] Dependências instaladas
)
goto :eof

:build_docker
echo [INFO] Construindo imagem Docker...
docker build -t replay-server .
echo [SUCCESS] Imagem Docker construída
goto main_menu

:start_dev
echo [INFO] Iniciando ambiente de desenvolvimento...
%DOCKER_COMPOSE% -f docker-compose.dev.yml up -d
echo [SUCCESS] Ambiente de desenvolvimento iniciado!
echo Acesse: http://localhost:3010
echo Health check: http://localhost:3010/health
echo Para ver logs: %DOCKER_COMPOSE% -f docker-compose.dev.yml logs -f
goto main_menu

:start_prod
echo [INFO] Iniciando ambiente de produção...
%DOCKER_COMPOSE% up -d
echo [SUCCESS] Ambiente de produção iniciado!
echo Acesse: http://localhost:3010
echo Health check: http://localhost:3010/health
echo Para ver logs: %DOCKER_COMPOSE% logs -f
goto main_menu

:stop_services
echo [INFO] Parando serviços...
%DOCKER_COMPOSE% down 2>nul
%DOCKER_COMPOSE% -f docker-compose.dev.yml down 2>nul
echo [SUCCESS] Serviços parados
goto main_menu

:end
echo Saindo...
exit /b 0