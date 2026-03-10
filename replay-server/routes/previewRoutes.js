const express = require('express');
const path = require('path');
const fs = require('fs');
const previewService = require('../services/previewService');
const { HLS_DIR } = require('../config/constants');

const router = express.Router();

// Rota principal para HLS
router.get('/preview-:cameraId/:filename', async (req, res) => {
  const cameraId = req.params.cameraId;
  const filename = req.params.filename;
  const filePath = path.join(HLS_DIR, `preview-${cameraId}`, filename);

  console.log(`📥 HLS Request: ${req.url}, Camera: ${cameraId}`);

  try {
    // Se for o arquivo principal .m3u8
    if (filename.endsWith('.m3u8')) {
      console.log(`🔍 Solicitando playlist principal para ${cameraId}`);
      
      try {
        // Garantir que o stream está disponível
        const hlsUrl = await previewService.ensureStreamAvailable(cameraId);
        console.log(`✅ Stream disponível: ${hlsUrl}`);
        
        // Registrar visualizador
        previewService.registerViewer(cameraId);
        
        // Aguardar um pouco para garantir que o arquivo foi criado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (fs.existsSync(filePath)) {
          console.log(`✅ Servindo playlist: ${filePath}`);
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          res.sendFile(filePath, (err) => {
            if (err) {
              console.error('❌ Erro ao servir playlist:', err);
              res.status(500).send('Erro ao servir playlist');
            }
          });
        } else {
          console.log(`❌ Playlist não encontrada: ${filePath}`);
          
          // Tentar criar o stream novamente
          setTimeout(async () => {
            try {
              await previewService.ensureStreamAvailable(cameraId);
            } catch (retryError) {
              console.error(`❌ Retry também falhou: ${retryError.message}`);
            }
          }, 1000);
          
          res.status(404).send('Playlist não encontrada - tentando recriar stream');
        }
        
      } catch (error) {
        console.log(`❌ Stream ${cameraId} não disponível:`, error.message);
        res.status(404).send('Stream não disponível: ' + error.message);
      }
      return;
    }

    // Se for segmento .ts
    if (filename.endsWith('.ts')) {
      if (fs.existsSync(filePath)) {
        console.log(`✅ Servindo segmento: ${filename}`);
        res.setHeader('Content-Type', 'video/MP2T');
        res.sendFile(filePath);
      } else {
        console.log(`❌ Segmento não encontrado: ${filePath}`);
        res.status(404).send('Segmento não encontrado');
      }
      return;
    }

    res.status(404).send('Arquivo não suportado');
  } catch (error) {
    console.error('❌ Erro no servidor HLS:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Rota para status dos streams
router.get('/status', (req, res) => {
  const activeStreams = previewService.getActiveStreams();
  const viewerCounts = previewService.getViewerCounts();
  
  res.json({
    activeStreams: activeStreams,
    viewerCounts: viewerCounts,
    timestamp: new Date().toISOString()
  });
});

// Rota para restart
router.get('/restart/:cameraId', async (req, res) => {
  const cameraId = req.params.cameraId;
  
  try {
    await previewService.stopPreview(cameraId);
    
    console.log(`🔄 Stream ${cameraId} parado`);
    
    res.json({
      success: true,
      message: `Stream ${cameraId} parado. Será iniciado sob demanda.`,
      cameraId: cameraId
    });
    
  } catch (error) {
    console.error(`❌ Erro ao reiniciar stream ${cameraId}:`, error);
    res.status(500).json({
      success: false,
      message: `Erro ao reiniciar stream: ${error.message}`
    });
  }
});

module.exports = router;