const path = require('path');
require('dotenv').config();

// Permite sobrepor configs via variáveis específicas do replay
// sem conflitar com variáveis usadas pelo Shinobi
const REPLAY_DB_HOST = process.env.REPLAY_DB_HOST || process.env.DB_HOST;
const REPLAY_DB_PORT = process.env.REPLAY_DB_PORT || process.env.DB_PORT;
const REPLAY_DB_USER = process.env.REPLAY_DB_USER || process.env.DB_USER;
const REPLAY_DB_PASSWORD = process.env.REPLAY_DB_PASSWORD || process.env.DB_PASSWORD;
const REPLAY_DB_NAME = process.env.REPLAY_DB_NAME || process.env.DB_NAME;
const REPLAY_DB_CONNECTION_LIMIT =
  process.env.REPLAY_DB_CONNECTION_LIMIT || process.env.DB_CONNECTION_LIMIT;

module.exports = {
  // Onde o Shinobi grava os vídeos dentro do container
  // No nosso Docker, isso é montado em /var/lib/shinobi/videos
  VIDEO_BASE_PATH:
    process.env.SHINOBI_VIDEOS_PATH ||
    process.env.REPLAY_SHINOBI_VIDEOS_PATH ||
    '/var/lib/shinobi/videos',

  GROUP_KEY: '1',
  SEGMENT_DURATION_SECONDS: parseInt(process.env.SEGMENT_DURATION, 10) || 30,
  DELAY_BEFORE_PROCESSING: 2000, // 2 segundos,
  MAX_VIDEO_RETRIES: 3,
  MIN_VIDEO_SIZE: 10240, // 10KB mínimo
  PROCESSING_TIMEOUT: parseInt(process.env.MAX_PROCESSING_TIME, 10) || 180000, // 3 minutos

  // Diretórios internos do serviço de replay
  TEMP_DIR: process.env.TEMP_PATH || path.join(__dirname, '..', 'temp'),
  HLS_DIR: process.env.HLS_PATH || path.join(__dirname, '..', 'hls'),
  WAIT_FOR_FINALIZATION: 2000,

  // Opcional: diretório para mover vídeos prontos
  FTP_VIDEOS_PATH: process.env.FTP_VIDEOS_PATH || '/home/ftp/videos',

  // Configuração do banco usada pelo replay-server
  DB_CONFIG: {
    host: REPLAY_DB_HOST || '181.189.64.66',
    port: parseInt(REPLAY_DB_PORT, 10) || 3305,
    user: REPLAY_DB_USER || 'kaio',
    password: REPLAY_DB_PASSWORD || 'Kaio@3005',
    database: REPLAY_DB_NAME || 'replayzone',
    connectionLimit: parseInt(REPLAY_DB_CONNECTION_LIMIT, 10) || 10,
    connectTimeout: 10000,
  },
};