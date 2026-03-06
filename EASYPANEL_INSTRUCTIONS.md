# 🚀 Instruções para EasyPanel - Shinobi ReplayZone

## ⚠️ Problema Identificado e Solução

O build estava falhando porque o EasyPanel estava usando o Dockerfile antigo com repositórios Debian desatualizados. **Já foi corrigido!**

## 🔧 Configuração no EasyPanel

### 1. Criar Novo Projeto

1. **Login no EasyPanel**
2. **Criar Projeto**:
   - Nome: `shinobi-replayzone`
   - Tipo: `Docker`
   - Repository: `https://github.com/kaiozinhoh/shinobi-replayzone.git`
   - Branch: `main`

### 2. Configurar Build

**IMPORTANTE**: Certifique-se de que está usando o Dockerfile correto:
- ✅ **Dockerfile**: `./Dockerfile` (não Dockerfile.prod)
- ✅ **Build Context**: `.` (raiz do projeto)

### 3. Configurar Variáveis de Ambiente

No EasyPanel, adicione estas variáveis de ambiente:

```env
NODE_ENV=production
DB_HOST=shinobi-db
DB_USER=shinobi
DB_PASSWORD=SuaSenhaSeguraAqui123!
DB_DATABASE=shinobi
DB_ROOT_PASSWORD=SenhaRootSegura456!
DB_PORT=3306
DB_TYPE=mysql
SHINOBI_PORT=8080
SUBSCRIPTION_ID=sub_XXXXXXXXXXXX
PLUGIN_KEYS={}
SSL_ENABLED=false
```

### 4. Configurar Banco de Dados

**Adicionar Serviço MariaDB**:
- Nome: `shinobi-db`
- Imagem: `mariadb:10.11`
- Variáveis de ambiente:
  ```env
  MYSQL_ROOT_PASSWORD=SenhaRootSegura456!
  MYSQL_DATABASE=shinobi
  MYSQL_USER=shinobi
  MYSQL_PASSWORD=SuaSenhaSeguraAqui123!
  MYSQL_CHARSET=utf8mb4
  MYSQL_COLLATION=utf8mb4_unicode_ci
  ```

### 5. Configurar Volumes

**Volumes necessários**:
- `shinobi_data` → `/var/lib/shinobi`
- `shinobi_videos` → `/var/lib/shinobi/videos`
- `shinobi_streams` → `/var/lib/shinobi/streams`
- `shinobi_logs` → `/var/lib/shinobi/logs`

### 6. Configurar Rede

- Criar rede: `shinobi_network`
- Conectar ambos os serviços (app e banco) à mesma rede

### 7. Configurar Portas

- **Aplicação**: `8080:8080`
- **Banco**: `3306:3306` (apenas interno)

## 🔄 Deploy Automático via GitHub

### Configurar Webhook (Opcional)

1. No EasyPanel, vá para **Project Settings > Webhooks**
2. Copie a URL do webhook
3. No GitHub, vá para **Settings > Webhooks**
4. Adicione o webhook do EasyPanel

### Configurar GitHub Actions

Os secrets já estão configurados nos workflows. Você precisa adicionar no GitHub:

1. `EASYPANEL_API_KEY` - Sua chave da API
2. `EASYPANEL_SERVER_ID` - ID do servidor  
3. `EASYPANEL_PROJECT_NAME` - `shinobi-replayzone`

## 🐛 Troubleshooting

### Build Falha com "404 Not Found"

✅ **RESOLVIDO**: Atualizamos de `buster-slim` para `bookworm-slim`

### Container não inicia

1. **Verificar logs**:
   ```bash
   # No EasyPanel, vá para Logs
   ```

2. **Verificar variáveis de ambiente**:
   - Todas as variáveis estão configuradas?
   - Senhas estão corretas?

3. **Verificar banco de dados**:
   - Banco está rodando?
   - Rede está configurada?

### Aplicação não responde

1. **Verificar health check**:
   - URL: `http://localhost:8080/`
   - Timeout: 10s

2. **Verificar portas**:
   - Porta 8080 exposta?
   - Firewall configurado?

## 📊 Monitoramento

### Health Checks

- **Endpoint**: `GET /`
- **Intervalo**: 30s
- **Timeout**: 10s
- **Retries**: 3

### Logs Importantes

- **Aplicação**: Container logs
- **Banco**: MariaDB logs
- **Build**: Build logs no EasyPanel

### Métricas

- **CPU**: < 70%
- **Memory**: < 80% 
- **Disk**: Monitorar volumes
- **Network**: Tráfego de vídeo

## 🔧 Comandos Úteis

### Verificar Status

```bash
# Via EasyPanel Dashboard
# Containers > shinobi-replayzone > Status
```

### Acessar Container

```bash
# Via EasyPanel Console
# Containers > shinobi-replayzone > Console
```

### Backup

```bash
# Backup do banco via EasyPanel
# Volumes > shinobi_data > Backup
```

## 🆘 Suporte

Se ainda tiver problemas:

1. **Verificar logs detalhados** no EasyPanel
2. **Abrir issue** no GitHub: https://github.com/kaiozinhoh/shinobi-replayzone/issues
3. **Verificar documentação** completa no README.md

---

## ✅ Checklist Final

- [ ] Projeto criado no EasyPanel
- [ ] Dockerfile correto configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados configurado
- [ ] Volumes configurados
- [ ] Rede configurada
- [ ] Portas expostas
- [ ] Health check funcionando
- [ ] Deploy automático ativo
- [ ] Aplicação acessível

**🎉 Seu Shinobi ReplayZone está pronto para produção!**