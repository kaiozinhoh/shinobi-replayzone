# 🎯 Configuração com Suas Variáveis - EasyPanel

## ✅ O Sistema Agora Usa SUAS Variáveis de Ambiente

O Shinobi foi corrigido para usar **exatamente** as variáveis que você definir, sem forçar valores fixos.

## 🗄️ Banco de Dados Recomendado:

### **MariaDB 10.11** (Recomendado)
- ✅ Mais compatível com Shinobi
- ✅ Usa `mysql_native_password` por padrão
- ✅ Menos problemas de autenticação

### **MySQL 5.7** (Alternativa)
- ✅ Também compatível
- ✅ Usa `mysql_native_password`

### **MySQL 8.0+** (Não recomendado)
- ❌ Usa `caching_sha2_password` (pode dar erro)
- ⚠️ Precisa configuração extra

## 🔧 Configuração no EasyPanel:

### 1. **Suas Variáveis de Ambiente**

Use **exatamente** as variáveis que você quiser:

```env
# Exemplo com suas configurações:
NODE_ENV=production
DB_HOST=meu-banco-personalizado
DB_USER=meu-usuario
DB_PASSWORD=minha-senha-123
DB_DATABASE=meu-banco
DB_PORT=3306
DB_TYPE=mysql
SHINOBI_PORT=8080
```

### 2. **Configurar MariaDB**

**Service Name**: Use o mesmo nome do `DB_HOST`
- Se `DB_HOST=meu-banco-personalizado`, então o serviço MariaDB deve se chamar `meu-banco-personalizado`

**Configurações do MariaDB**:
```env
MYSQL_ROOT_PASSWORD=senha-root-123
MYSQL_DATABASE=meu-banco          # Mesmo do DB_DATABASE
MYSQL_USER=meu-usuario           # Mesmo do DB_USER  
MYSQL_PASSWORD=minha-senha-123   # Mesmo do DB_PASSWORD
```

**Command/Args do MariaDB**:
```bash
--character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-authentication-plugin=mysql_native_password
```

## 📋 Exemplo Completo:

### **Serviço Shinobi**:
```env
NODE_ENV=production
DB_HOST=replayzonebot_replayzonedb    # Nome do seu serviço de banco
DB_USER=kaio                          # Seu usuário
DB_PASSWORD=SuaSenhaSegura123!        # Sua senha
DB_DATABASE=ccio                      # Seu banco
DB_PORT=3306
DB_TYPE=mysql
SHINOBI_PORT=8080
```

### **Serviço MariaDB**:
- **Name**: `replayzonebot_replayzonedb`
- **Environment**:
  ```env
  MYSQL_ROOT_PASSWORD=RootPassword456!
  MYSQL_DATABASE=ccio
  MYSQL_USER=kaio
  MYSQL_PASSWORD=SuaSenhaSegura123!
  ```
- **Command**: `--character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-authentication-plugin=mysql_native_password`

## ✅ Verificação:

Os logs devem mostrar **suas configurações**:

```
🚀 Iniciando Shinobi CCTV...
[2026-03-07 XX:XX:XX] Usando configurações das variáveis de ambiente:
[2026-03-07 XX:XX:XX] DB_HOST: replayzonebot_replayzonedb
[2026-03-07 XX:XX:XX] DB_USER: kaio
[2026-03-07 XX:XX:XX] DB_DATABASE: ccio
[2026-03-07 XX:XX:XX] DB_PASSWORD: ****** (definida)
Shinobi : Web Server Listening on 8080
```

## 🎯 Resumo:

1. ✅ **Use MariaDB 10.11** (mais compatível)
2. ✅ **Defina suas variáveis** como quiser
3. ✅ **Nome do serviço** = `DB_HOST`
4. ✅ **Mesmas credenciais** nos dois serviços
5. ✅ **Command do MariaDB** com autenticação compatível

**Agora o sistema respeita 100% suas configurações!** 🎉