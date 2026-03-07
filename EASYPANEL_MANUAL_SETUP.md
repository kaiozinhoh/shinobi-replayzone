# 🔧 Configuração Manual no EasyPanel - Shinobi ReplayZone

## ⚠️ Se as variáveis não apareceram automaticamente

### 1. Criar Projeto Manualmente

1. **EasyPanel** → **Create Project** → **Empty Project**
2. **Nome**: `shinobi-replayzone`

### 2. Adicionar Serviço da Aplicação

1. **Add Service** → **App**
2. **Source**: 
   - **Type**: GitHub
   - **Repository**: `kaiozinhoh/shinobi-replayzone`
   - **Branch**: `main`
3. **Build**:
   - **Type**: Dockerfile
   - **Dockerfile**: `Dockerfile`
4. **Deploy**:
   - **Port**: `8080`

### 3. Configurar Variáveis de Ambiente

**IMPORTANTE**: Adicione TODAS estas variáveis no serviço da aplicação:

```env
NODE_ENV=production
DB_HOST=shinobi-db
DB_USER=shinobi
DB_PASSWORD=SuaSenhaSegura123!
DB_DATABASE=shinobi
DB_PORT=3306
DB_TYPE=mysql
SHINOBI_PORT=8080
SUBSCRIPTION_ID=sub_XXXXXXXXXXXX
PLUGIN_KEYS={}
SSL_ENABLED=false
```

### 4. Adicionar Serviço do Banco de Dados

1. **Add Service** → **Database** → **MariaDB**
2. **Name**: `shinobi-db`
3. **Database**: `shinobi`
4. **Username**: `shinobi`
5. **Password**: `SuaSenhaSegura123!` (mesma do DB_PASSWORD)
6. **Root Password**: `SenhaRoot456!`

### 5. Configurar Volumes

**No serviço da aplicação**, adicione volumes:

```
/var/lib/shinobi → shinobi-data
/var/lib/shinobi/videos → shinobi-videos
/var/lib/shinobi/streams → shinobi-streams
```

### 6. Configurar Rede

1. **Networks** → **Create Network**: `shinobi-network`
2. **Conectar ambos os serviços** à mesma rede

### 7. Deploy

1. **Deploy** o banco primeiro
2. **Aguardar** o banco ficar pronto
3. **Deploy** a aplicação

## 🔍 Verificar Configuração

### Logs da Aplicação

Deve mostrar:

```
🚀 Iniciando Shinobi CCTV...
[2026-03-07 04:27:30] DB_HOST: shinobi-db
[2026-03-07 04:27:30] DB_USER: shinobi
[2026-03-07 04:27:30] DB_DATABASE: shinobi
[2026-03-07 04:27:30] DB_PASSWORD: ****** (definida)
Shinobi : Web Server Listening on 8080
```

### Se ainda der erro de conexão:

1. **Verificar** se o banco está rodando
2. **Verificar** se os nomes dos serviços estão corretos
3. **Verificar** se as senhas são iguais nos dois serviços
4. **Verificar** se estão na mesma rede

## 🎯 Checklist Final

- [ ] Serviço `shinobi` criado
- [ ] Serviço `shinobi-db` criado
- [ ] Variáveis de ambiente configuradas
- [ ] Senhas iguais nos dois serviços
- [ ] Volumes configurados
- [ ] Rede configurada
- [ ] Ambos os serviços deployados
- [ ] Aplicação acessível na porta 8080

## 🆘 Se ainda não funcionar

1. **Logs do banco**: Verificar se o MariaDB está iniciando
2. **Logs da app**: Verificar as variáveis de ambiente
3. **Network**: Testar conectividade entre serviços
4. **Restart**: Reiniciar ambos os serviços

**Após seguir estes passos, o Shinobi deve conectar corretamente no banco!** 🎉