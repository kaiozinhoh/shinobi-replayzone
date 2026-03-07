# 🔧 Corrigir Erro de Autenticação MySQL no EasyPanel

## ⚠️ Problema Identificado:

```
Error: ER_NOT_SUPPORTED_AUTH_MODE: Client does not support authentication protocol requested by server
```

## 🚀 Solução Rápida:

### 1. **Configurar MariaDB no EasyPanel**

Quando criar o serviço MariaDB, adicione esta **variável de ambiente**:

```env
MARIADB_MYSQL_LOCALHOST_USER=1
MARIADB_MYSQL_LOCALHOST_GRANTS=RELOAD,PROCESS,LOCK TABLES,REPLICATION CLIENT
```

E no **Command/Args**, adicione:

```bash
--default-authentication-plugin=mysql_native_password
--character-set-server=utf8mb4
--collation-server=utf8mb4_unicode_ci
```

### 2. **Verificar Variáveis do Shinobi**

Certifique-se que estas variáveis estão **EXATAMENTE** assim:

```env
NODE_ENV=production
DB_HOST=shinobi-db
DB_USER=shinobi
DB_PASSWORD=SuaSenhaSegura123!
DB_DATABASE=shinobi
DB_PORT=3306
DB_TYPE=mysql
SHINOBI_PORT=8080
```

### 3. **Rebuild Ambos os Serviços**

1. **Rebuild MariaDB** primeiro
2. **Aguardar** ficar pronto
3. **Rebuild Shinobi** depois

## 🔍 Verificar se Funcionou:

Os logs devem mostrar:

```
🚀 Iniciando Shinobi CCTV...
[2026-03-07 XX:XX:XX] FORÇANDO configurações corretas para EasyPanel:
[2026-03-07 XX:XX:XX] DB_HOST: shinobi-db
[2026-03-07 XX:XX:XX] DB_USER: shinobi
[2026-03-07 XX:XX:XX] DB_DATABASE: shinobi
[2026-03-07 XX:XX:XX] DB_PASSWORD: ****** (definida)
Shinobi : Web Server Listening on 8080
```

**SEM** erros de `ER_NOT_SUPPORTED_AUTH_MODE`.

## 🆘 Se ainda não funcionar:

### Opção A: Usar MySQL 5.7

Trocar MariaDB por MySQL 5.7:
- **Image**: `mysql:5.7`
- **Não precisa** do `--default-authentication-plugin`

### Opção B: Configuração Manual do Banco

1. **Acessar console** do MariaDB no EasyPanel
2. **Executar**:
   ```sql
   ALTER USER 'shinobi'@'%' IDENTIFIED WITH mysql_native_password BY 'SuaSenhaSegura123!';
   FLUSH PRIVILEGES;
   ```

## ✅ Checklist Final:

- [ ] MariaDB com `--default-authentication-plugin=mysql_native_password`
- [ ] Variáveis de ambiente corretas no Shinobi
- [ ] Mesmo nome de serviço (`shinobi-db`)
- [ ] Mesma senha nos dois serviços
- [ ] Rebuild de ambos os serviços
- [ ] Logs sem erro de autenticação

**Após seguir estes passos, o Shinobi deve conectar corretamente!** 🎉