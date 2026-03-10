// controllers/previewController.js
const previewService = require('../services/previewService');
const databaseService = require('../services/databaseService');
const errorNotifier = require('../telegram/notifications/errorNotifier');

class PreviewController {
  async startPreview(req, res) {
    try {
      const { cameraId, quadraId } = req.query;
      
      if (!cameraId) {
        return res.status(400).json({
          success: false,
          message: 'Camera ID é obrigatório'
        });
      }

      // Verificar se o stream está ativo no mediamtx
      const isStreamActive = true;//await previewService.checkStreamStatus(cameraId);
      
      if (!isStreamActive) {
        return res.status(404).json({
          success: false,
          message: 'Stream não está ativo no servidor. Verifique se a câmera está enviando o stream.'
        });
      }

      const previewUrl = await previewService.startPreview(cameraId, quadraId);
      
      res.status(200).json({
        success: true,
        previewUrl: previewUrl,
        message: 'Preview iniciado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao iniciar preview:', error);
      errorNotifier.sendNotification(req.query.cameraId, 2, 'PreviewController');
      
      res.status(500).json({
        success: false,
        message: 'Erro ao iniciar preview: ' + error.message
      });
    }
  }

  async restartPreview(req, res) {
    try {
      const { cameraId } = req.query;
      
      if (!cameraId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parâmetro cameraId é obrigatório' 
        });
      }
      
      console.log(`🔄 Solicitado restart para câmera: ${cameraId}`);
      
      const result = await previewService.restartPreview(cameraId);
      
      res.json({
        success: true,
        message: `Stream reiniciado com sucesso para câmera ${cameraId}`,
        hlsUrl: result
      });
      
    } catch (error) {
      console.error('❌ Erro ao reiniciar preview:', error);
      res.status(500).json({
        success: false,
        message: `Erro ao reiniciar stream: ${error.message}`
      });
    }
  }

  async stopPreview(req, res) {
    try {
      const { cameraId } = req.query;
      
      if (!cameraId) {
        return res.status(400).json({
          success: false,
          message: 'Camera ID é obrigatório'
        });
      }

      previewService.stopPreview(cameraId);
      
      res.status(200).json({
        success: true,
        message: 'Preview parado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao parar preview:', error);
      errorNotifier.sendNotification(req.query.cameraId, 2, 'PreviewController');
      
      res.status(500).json({
        success: false,
        message: 'Erro ao parar preview'
      });
    }
  }

  async getPreviewStatus(req, res) {
    try {
      const { cameraId } = req.query;
      
      if (!cameraId) {
        return res.status(400).json({
          success: false,
          message: 'Camera ID é obrigatório'
        });
      }

      const previewUrl = previewService.getPreviewUrl(cameraId);
      const isStreamActive = await previewService.checkStreamStatus(cameraId);
      
      res.status(200).json({
        success: true,
        isActive: !!previewUrl,
        streamActive: isStreamActive,
        previewUrl: previewUrl
      });

    } catch (error) {
      console.error('Erro ao verificar status do preview:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar status'
      });
    }
  }

  async startBroadcast(req, res) {
    try {
      const { cameraId, platform, rtmpUrl, streamKey } = req.body;
      
      if (!cameraId || !platform || !rtmpUrl || !streamKey) {
        return res.status(400).json({
          success: false,
          message: 'Todos os parâmetros são obrigatórios'
        });
      }

      const broadcastProcess = await previewService.startSocialBroadcast(
        cameraId, 
        platform, 
        rtmpUrl, 
        streamKey
      );
      
      res.status(200).json({
        success: true,
        message: `Broadcast para ${platform} iniciado com sucesso`,
        processId: broadcastProcess.pid
      });

    } catch (error) {
      console.error('Erro ao iniciar broadcast:', error);
      errorNotifier.sendNotification(req.body.cameraId, 3, 'PreviewController');
      
      res.status(500).json({
        success: false,
        message: 'Erro ao iniciar broadcast: ' + error.message
      });
    }
  }
}

module.exports = new PreviewController();