#!/usr/bin/env node

// Script para corrigir configuração do Shinobi no EasyPanel
const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo configuração do Shinobi...');

// Ler variáveis de ambiente
const config = {
    port: 8080,
    debugLog: false,
    enableFaceManager: false,
    videosDir: "/var/lib/shinobi/videos",
    passwordType: "sha256",
    detectorMergePamRegionTriggers: true,
    wallClockTimestampAsDefault: true,
    useBetterP2P: true,
    smtpServerOptions: {
        allowInsecureAuth: true
    },
    addStorage: [
        {"name":"streams","path":"/var/lib/shinobi/streams"},
        {"name":"backup","path":"/var/lib/shinobi/backup"}
    ],
    db: {
        host: process.env.DB_HOST || "db",
        user: process.env.DB_USER || "shinobi", 
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_DATABASE || "shinobi",
        port: parseInt(process.env.DB_PORT || "3306"),
        type: "mysql2"  // FORÇAR mysql2
    },
    databaseType: "mysql2",  // FORÇAR mysql2
    mail: {
        service: "gmail",
        auth: {
            user: "",
            pass: ""
        }
    },
    cron: {
        key: "fd6c7849-904d-47bd-b562-89768deea915"
    },
    pluginKeys: {},
    ssl: {
        key: "",
        cert: "",
        enabled: false
    },
    customAutoLoad: []
};

// Escrever arquivo de configuração
const configPath = '/home/Shinobi/conf.json';
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('✅ Configuração corrigida!');
console.log('📋 Configurações do banco:');
console.log(`   Host: ${config.db.host}`);
console.log(`   User: ${config.db.user}`);
console.log(`   Database: ${config.db.database}`);
console.log(`   Port: ${config.db.port}`);
console.log(`   Type: ${config.db.type}`);
console.log(`   DatabaseType: ${config.databaseType}`);