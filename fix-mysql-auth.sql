-- Script para corrigir autenticação MySQL/MariaDB
-- Deve ser executado no banco de dados

-- Alterar plugin de autenticação para compatibilidade
ALTER USER 'shinobi'@'%' IDENTIFIED WITH mysql_native_password BY 'SuaSenhaSegura123!';
ALTER USER 'shinobi'@'localhost' IDENTIFIED WITH mysql_native_password BY 'SuaSenhaSegura123!';

-- Criar usuário se não existir
CREATE USER IF NOT EXISTS 'shinobi'@'%' IDENTIFIED WITH mysql_native_password BY 'SuaSenhaSegura123!';
CREATE USER IF NOT EXISTS 'shinobi'@'localhost' IDENTIFIED WITH mysql_native_password BY 'SuaSenhaSegura123!';

-- Dar permissões
GRANT ALL PRIVILEGES ON shinobi.* TO 'shinobi'@'%';
GRANT ALL PRIVILEGES ON shinobi.* TO 'shinobi'@'localhost';

-- Aplicar mudanças
FLUSH PRIVILEGES;