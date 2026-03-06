# 🚀 Guia de Início Rápido - Shinobi CCTV

## ⚡ Setup em 5 Minutos

### 1. Configuração Inicial

```bash
# 1. Copie e configure as variáveis de ambiente
cp .env.example .env

# 2. Edite o arquivo .env com suas configurações
# Altere pelo menos:
# - DB_PASSWORD=sua_senha_aqui
# - DB_ROOT_PASSWORD=sua_senha_root_aqui

# 3. Inicie os serviços
docker-compose up -d
```

### 2. Acesso à Aplicação

- **URL**: http://localhost:8080
- **Usuário padrão**: admin@shinobi.video  
- **Senha padrão**: admin

### 3. Primeira Configuração

1. **Altere a senha padrão**
2. **Configure sua primeira câmera**
3. **Teste a gravação**

## 🌐 Deploy no EasyPanel

### Configuração Rápida

1. **Configure os secrets no GitHub**:
   - `EASYPANEL_API_KEY`
   - `EASYPANEL_SERVER_ID` 
   - `EASYPANEL_PROJECT_NAME`

2. **Push para o GitHub**:
   ```bash
   git add .
   git commit -m "Setup Shinobi for EasyPanel"
   git push origin main
   ```

3. **Deploy automático**: O GitHub Actions fará o resto!

## 📋 Checklist de Verificação

- [ ] Docker e Docker Compose instalados
- [ ] Arquivo `.env` configurado
- [ ] Serviços rodando (`docker-compose ps`)
- [ ] Aplicação acessível (http://localhost:8080)
- [ ] Senha padrão alterada
- [ ] GitHub configurado (para deploy automático)
- [ ] EasyPanel configurado (para produção)

## 🛠️ Comandos Úteis

```bash
# Ver status dos serviços
docker-compose ps

# Ver logs
docker-compose logs -f shinobi

# Parar serviços
docker-compose down

# Reiniciar serviços
docker-compose restart

# Deploy para EasyPanel (Linux/Mac)
./scripts/deploy-easypanel.sh deploy latest

# Backup do banco de dados
docker-compose exec db mysqldump -u root -p shinobi > backup.sql
```

## 🔧 Solução de Problemas

### Container não inicia
```bash
# Verificar logs
docker-compose logs shinobi

# Verificar se as portas estão livres
netstat -tulpn | grep :8080
```

### Banco de dados não conecta
```bash
# Testar conexão
docker-compose exec shinobi nc -zv db 3306

# Resetar banco de dados
docker-compose down -v
docker-compose up -d
```

### Aplicação lenta
```bash
# Verificar recursos
docker stats

# Aumentar recursos no docker-compose.yml
```

## 📞 Suporte

- **Documentação completa**: [README.md](README.md)
- **Guia de deploy**: [DEPLOY.md](DEPLOY.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/shinobi/issues)

---

**🎯 Em caso de dúvidas, consulte a documentação completa ou abra uma issue no GitHub!**