require('dotenv').config();
const express = require('express');
const path = require('path');
const replayRoutes = require('./routes/replayRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const previewRoutes = require('./routes/previewRoutes');
const fileService = require('./services/fileService');
const { HLS_DIR } = require('./config/constants');

// Inicializar diretórios necessários
fileService.ensureDirectoriesExist();

const app = express();
const PORT = process.env.PORT || 3010;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 ROTAS HLS SOB DEMANDA (DEVE VIR PRIMEIRO)
app.use('/hls', previewRoutes);

// 🔥 SERVIÇO ESTÁTICO (apenas para fallback)
app.use('/hls', express.static(HLS_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/MP2T');
    }
  }
}));

// Outras rotas
app.use('', replayRoutes);
app.use('', notificationRoutes);
app.use('/preview', previewRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    hlsDir: HLS_DIR
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 Server rodando na porta ${PORT}`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`📺 HLS Sob Demanda: ${process.env.BASE_URL || `http://localhost:${PORT}`}/hls/preview-ARENACAPI1/index.m3u8`);
  console.log(`📊 Status: ${process.env.BASE_URL || `http://localhost:${PORT}`}/hls/status`);
});

module.exports = app;