// Configuração automática do banco de dados
// Detecta se deve usar mysql ou mysql2 baseado na disponibilidade

let dbClient = 'mysql2'; // Padrão moderno

try {
    // Tentar usar mysql2 primeiro (mais moderno)
    require('mysql2');
    dbClient = 'mysql2';
} catch (e) {
    try {
        // Fallback para mysql antigo se mysql2 não estiver disponível
        require('mysql');
        dbClient = 'mysql';
    } catch (e2) {
        console.error('Nenhum driver MySQL encontrado. Instale mysql2 ou mysql.');
        process.exit(1);
    }
}

module.exports = {
    client: dbClient,
    getConfig: (config) => {
        const dbConfig = {
            client: dbClient,
            connection: {
                host: config.db.host,
                port: config.db.port,
                user: config.db.user,
                password: config.db.password,
                database: config.db.database,
                charset: 'utf8mb4',
                timezone: 'UTC'
            },
            pool: {
                min: 2,
                max: 10
            },
            migrations: {
                tableName: 'knex_migrations'
            }
        };

        // Configurações específicas para mysql2
        if (dbClient === 'mysql2') {
            dbConfig.connection.supportBigNumbers = true;
            dbConfig.connection.bigNumberStrings = true;
            dbConfig.connection.dateStrings = true;
        }

        return dbConfig;
    }
};