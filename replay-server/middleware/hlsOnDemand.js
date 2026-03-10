// middleware/hlsOnDemand.js
const path = require('path');
const fs = require('fs');
const previewService = require('../services/previewService');
const { HLS_DIR } = require('../config/constants');

function hlsOnDemandMiddleware(req, res, next) {
  const url = req.url;
  
  // Verificar se é uma requisição HLS de preview
  if (url.startsWith('/hls/preview-') && (url.endsWith('.m3u8') || url.endsWith('.ts'))) {
    const filename = path.basename(url);
    const cameraMatch = filename.match(/preview-(.+)\./);
    
    if (cameraMatch && cameraMatch[1]) {
      const cameraId = cameraMatch[1].replace('.m3u8', '').replace('.ts', '');
      const filePath = path.join(HLS_DIR, url.substring(1)); // Remove a barra inicial
      
      console.log(`📥 Request HLS: ${url}, Camera: ${cameraId}`);
      
      // Se for o arquivo principal .m3u8, registrar visualizador
      if (url.endsWith('.m3u8')) {
        const viewerCount = previewService.registerViewer(cameraId);
        console.log(`📊 Visualizadores ativos para ${cameraId}: ${viewerCount}`);
      }
      
      // Verificar se o arquivo existe
      if (fs.existsSync(filePath)) {
        console.log(`✅ Arquivo encontrado: ${filePath}`);
        
        // Configurar headers apropriados
        if (url.endsWith('.m3u8')) {
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else if (url.endsWith('.ts')) {
          res.setHeader('Content-Type', 'video/MP2T');
        }
        
        // Servir o arquivo
        res.sendFile(filePath, (err) => {
          if (err) {
            console.error('❌ Erro ao servir arquivo:', err);
          }
          
          // Quando a resposta terminar, remover visualizador (apenas para .m3u8)
          if (url.endsWith('.m3u8')) {
            setTimeout(() => {
              previewService.removeViewer(cameraId);
            }, 1000);
          }
        });
        
        return; // Não chamar next()
      } else {
        console.log(`❌ Arquivo não encontrado: ${filePath}`);
        
        // Se for .m3u8 e não existe, tentar iniciar stream sob demanda
        if (url.endsWith('.m3u8')) {
          console.log(`🎬 Tentando iniciar stream sob demanda para: ${cameraId}`);
          
          previewService.ensureStreamAvailable(cameraId)
            .then(() => {
              // Recarregar a página após iniciar o stream
              res.redirect(url);
            })
            .catch(error => {
              console.error(`❌ Erro ao iniciar stream: ${error.message}`);
              res.status(404).send('Stream não disponível');
            });
        } else {
          res.status(404).send('Arquivo não encontrado');
        }
        return;
      }
    }
  }
  
  next();
}

module.exports = hlsOnDemandMiddleware;