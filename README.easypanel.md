# 🚀 Deploy Automático no EasyPanel - Shinobi ReplayZone

## ⚡ Deploy em 1 Clique

Este projeto está configurado para deploy automático no EasyPanel, similar ao n8n e Evo API.

### 🎯 Deploy Rápido

1. **No EasyPanel**, clique em **"Create Project"**
2. **Selecione "From Template"** 
3. **Cole esta URL**: `https://github.com/kaiozinhoh/shinobi-replayzone`
4. **Clique em "Deploy"**

### 🔧 Configurações Automáticas

O EasyPanel detectará automaticamente:

- ✅ **Dockerfile** otimizado
- ✅ **Variáveis de ambiente** pré-configuradas
- ✅ **Banco MariaDB** configurado automaticamente
- ✅ **Volumes** para armazenamento persistente
- ✅ **Health checks** configurados
- ✅ **Rede interna** entre serviços

### 🔑 Variáveis Pré-configuradas

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `DB_PASSWORD` | `shinobi123!@#` | Senha do banco (altere!) |
| `DB_ROOT_PASSWORD` | `rootpassword123!@#` | Senha root (altere!) |
| `NODE_ENV` | `production` | Ambiente de produção |
| `DB_HOST` | `shinobi-db` | Host do banco |
| `DB_USER` | `shinobi` | Usuário do banco |
| `DB_DATABASE` | `shinobi` | Nome do banco |
| `SHINOBI_PORT` | `8080` | Porta da aplicação |

### 🛠️ Personalização

Após o deploy, você pode alterar:

1. **Senhas do banco** (recomendado)
2. **Configurações de SSL**
3. **Integrações com nuvem**
4. **Notificações**

### 📋 Checklist Pós-Deploy

- [ ] Aplicação acessível em `https://seu-dominio.com`
- [ ] Login com `admin@shinobi.video` / `admin`
- [ ] Alterar senha padrão
- [ ] Alterar senhas do banco de dados
- [ ] Configurar primeira câmera
- [ ] Testar gravação

### 🔒 Segurança

**⚠️ IMPORTANTE**: Altere as senhas padrão!

```bash
# No EasyPanel, vá para:
# Project > Services > shinobi > Environment Variables
# Altere:
DB_PASSWORD=SuaNovaSenhaSegura123!
DB_ROOT_PASSWORD=SuaSenhaRootSegura456!
```

### 🎥 Primeira Configuração

1. **Acesse a aplicação**
2. **Login**: `admin@shinobi.video`
3. **Senha**: `admin`
4. **Altere a senha** imediatamente
5. **Vá para "Monitors"**
6. **Adicione sua primeira câmera**

### 📊 Monitoramento

O EasyPanel fornece automaticamente:

- **Health checks** a cada 30s
- **Logs** da aplicação e banco
- **Métricas** de CPU e memória
- **Alertas** em caso de falha
- **Backup** automático dos volumes

### 🔄 Atualizações

Para atualizar:

1. **No EasyPanel**: Project > Services > shinobi
2. **Clique em "Rebuild"**
3. **Aguarde o deploy** (automático)

### 🆘 Suporte

- **Logs**: EasyPanel > Project > Logs
- **Issues**: [GitHub Issues](https://github.com/kaiozinhoh/shinobi-replayzone/issues)
- **Documentação**: [README.md](README.md)

---

## 🎯 Diferenças do Deploy Manual

| Recurso | Deploy Manual | EasyPanel Template |
|---------|---------------|-------------------|
| Configuração | 30+ passos | 1 clique |
| Variáveis | Manual | Pré-configuradas |
| Banco de dados | Configuração manual | Automático |
| SSL | Manual | Automático |
| Monitoramento | Manual | Incluído |
| Backup | Manual | Automático |

**🚀 Com o template do EasyPanel, você economiza horas de configuração!**