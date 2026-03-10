# 🎬 Replay Server

Sistema de replay e streaming de vídeos com HLS para quadras esportivas, integrado com Shinobi, FFmpeg e notificações via Telegram.

## 🚀 Funcionalidades

- **📹 Processamento de Vídeos**: Captura e conversão usando FFmpeg
- **🎥 Streaming HLS**: Geração de streams HLS sob demanda
- **📱 Notificações Telegram**: Sistema completo de notificações de erro e sucesso
- **👁️ Preview em Tempo Real**: Sistema de preview de vídeos
- **📊 Monitoramento**: Monitor de servidor com relatórios automáticos
- **🗂️ Gestão de Arquivos**: Organização e limpeza automática de arquivos
- **🔴 Live Streaming**: Endpoint para streaming ao vivo com logos e patrocinadores

## 🏗️ Arquitetura

```
replay-server/
├── 📁 config/           # Configurações do sistema
├── 📁 controllers/      # Controladores das rotas
├── 📁 services/         # Serviços de negócio
├── 📁 routes/           # Definição de rotas
├── 📁 middleware/       # Middlewares customizados
├── 📁 telegram/         # Sistema de notificações Telegram
└── 📁 examples/         # Exemplos de uso
```

## 🛠️ Tecnologias

- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **FFmpeg** - Processamento de vídeo
- **MySQL** - Banco de dados
- **Docker** - Containerização
- **HLS** - HTTP Live Streaming
- **Telegram Bot API** - Notificações

## 🚀 Deploy Rápido

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/replay-server.git
cd replay-server
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Deploy com Docker
```bash
# Produção
docker-compose up -d

# Desenvolvimento
docker-compose -f docker-compose.dev.yml up
```

### 4. Deploy no EasyPanel
Siga o guia completo em [`easypanel-setup.md`](./easypanel-setup.md)

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente de execução | `production` |
| `PORT` | Porta do servidor | `3010` |
| `DB_HOST` | Host do MySQL | `db.replayzone.com.br` |
| `DB_USER` | Usuário do MySQL | `replayzone` |
| `DB_PASSWORD` | Senha do MySQL | - |
| `DB_NAME` | Nome do banco | `replayzone` |
| `TELEGRAM_ERROR_TOKEN` | Token do bot de erro | - |
| `TELEGRAM_SUCCESS_TOKEN` | Token do bot de sucesso | - |
| `BASE_URL` | URL base da aplicação | - |

### Volumes Docker

| Volume | Descrição | Tamanho Recomendado |
|--------|-----------|-------------------|
| `shinobi-videos` | Vídeos do Shinobi | 50GB+ |
| `ftp-videos` | Vídeos FTP | 50GB+ |
| `temp-files` | Arquivos temporários | 10GB |
| `hls-files` | Arquivos HLS | 20GB |

## 📡 API Endpoints

### Replay
- `POST /replay` - Processar replay de vídeo
- `GET /replay/:id` - Obter informações do replay

### Live Streaming
- `GET /live/:subquadraId/index.m3u8` - Stream HLS ao vivo
- `GET /live/:subquadraId/:segment` - Segmentos do stream
- `DELETE /live/:subquadraId` - Parar stream

### Preview
- `GET /hls/preview-:cameraId/index.m3u8` - Preview HLS
- `GET /hls/status` - Status dos streams

### Health Check
- `GET /health` - Status da aplicação

## 🔧 Desenvolvimento

### Pré-requisitos
- Node.js 18+
- FFmpeg instalado
- MySQL 8.0+
- Docker (opcional)

### Instalação Local
```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env

# Iniciar em modo desenvolvimento
npm run dev

# Iniciar em produção
npm start
```

### Estrutura de Desenvolvimento
```bash
# Executar testes
npm test

# Executar linting
npm run lint

# Build Docker local
docker build -t replay-server .

# Executar com Docker Compose
docker-compose -f docker-compose.dev.yml up
```

## 🐳 Docker

### Build da Imagem
```bash
docker build -t replay-server .
```

### Executar Container
```bash
docker run -d \
  --name replay-server \
  -p 3010:3010 \
  --env-file .env \
  -v $(pwd)/temp:/app/temp \
  -v $(pwd)/hls:/app/hls \
  replay-server
```

### Docker Compose
```bash
# Produção
docker-compose up -d

# Desenvolvimento com hot reload
docker-compose -f docker-compose.dev.yml up

# Ver logs
docker-compose logs -f replay-server
```

## 🚀 Deploy Automático

### GitHub Actions
O projeto inclui workflows automáticos que:

1. **Executam testes** a cada push/PR
2. **Constroem imagem Docker** automaticamente
3. **Fazem deploy no EasyPanel** quando há push na branch main

### Configurar Deploy Automático

1. **Configure o webhook do EasyPanel**:
   ```bash
   # No GitHub, adicione o secret:
   EASYPANEL_WEBHOOK_URL=https://seu-easypanel.com/webhook/...
   ```

2. **Push para a branch main**:
   ```bash
   git add .
   git commit -m "feat: nova funcionalidade"
   git push origin main
   ```

3. **Deploy automático será executado** 🚀

## 📊 Monitoramento

### Health Checks
- **URL**: `/health`
- **Intervalo**: 30s
- **Timeout**: 10s

### Logs
```bash
# Docker Compose
docker-compose logs -f

# Container individual
docker logs -f replay-server

# EasyPanel
# Ver logs no painel web
```

### Métricas
- Status dos streams ativos
- Uso de CPU e memória
- Espaço em disco dos volumes
- Conectividade com banco de dados

## 🔒 Segurança

### Boas Práticas Implementadas
- ✅ Usuário não-root no container
- ✅ Variáveis de ambiente para credenciais
- ✅ Validação de entrada nos endpoints
- ✅ Health checks configurados
- ✅ Logs de segurança
- ✅ Timeouts configurados

### Recomendações Adicionais
- Configure backup automático dos volumes
- Use HTTPS em produção
- Monitore logs de acesso
- Mantenha dependências atualizadas

## 🛠️ Troubleshooting

### Problemas Comuns

#### Container não inicia
```bash
# Verificar logs
docker logs replay-server

# Verificar variáveis de ambiente
docker exec replay-server env

# Testar conectividade com banco
docker exec replay-server nc -zv db.replayzone.com.br 3306
```

#### Problemas de streaming
```bash
# Verificar FFmpeg
docker exec replay-server ffmpeg -version

# Verificar espaço em disco
docker exec replay-server df -h

# Verificar processos
docker exec replay-server ps aux
```

#### Problemas de performance
- Aumentar recursos (CPU/RAM) no EasyPanel
- Verificar uso de disco dos volumes
- Otimizar configurações do FFmpeg
- Monitorar logs de erro

## 📞 Suporte

### Links Úteis
- [Documentação FFmpeg](https://ffmpeg.org/documentation.html)
- [Documentação HLS](https://developer.apple.com/documentation/http_live_streaming)
- [EasyPanel Docs](https://easypanel.io/docs)
- [Docker Docs](https://docs.docker.com/)

### Contato
- **Email**: suporte@replayzone.com.br
- **Telegram**: @replayzone_support

## 📄 Licença

Este projeto está licenciado sob a licença ISC - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

**Desenvolvido com ❤️ pela equipe ReplayZone**