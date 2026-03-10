const videoService = require('../services/videoService');
const fileService = require('../services/fileService');
const databaseService = require('../services/databaseService');
const sponsorService = require('../services/sponsorService');
const { DELAY_BEFORE_PROCESSING, TEMP_DIR, FTP_VIDEOS_PATH } = require('../config/constants');
const path = require('path');
const fs = require('fs');
const errorNotifier = require('../telegram/notifications/errorNotifier');
const successNotifier = require('../telegram/notifications/successNotifier');

class ReplayController {
  constructor() {
    this.processReplay = this.processReplay.bind(this);
    this.processLiveStream = this.processLiveStream.bind(this);
    this.generateHLSPreview = this.generateHLSPreview.bind(this);
  }

  async processReplay(req, res) {
    try {
      const { id, subquadraId, position, quadraId, secondCameraId } = req.query;
      
      console.log(`📹 Iniciando processamento: ${id}, Posição: ${position}`);
      
      // Validações
      if (!id || !subquadraId || position === undefined || !quadraId) {
        const errorMsg = 'Parâmetros obrigatórios faltando';
        console.error(`❌ ${errorMsg}:`, { id, subquadraId, position, quadraId });
        
        // Reportar erro de validação para Telegram
        errorNotifier.sendNotification(
          id || 'N/A',
          4,
          'processReplay - Validação',
          {
            message: errorMsg,
            params: { id, subquadraId, position, quadraId, secondCameraId },
            timestamp: new Date().toISOString()
          }
        );
        
        return res.status(400).json({ 
          success: false, 
          message: errorMsg 
        });
      }

      if (position !== '0' && !secondCameraId) {
        const errorMsg = 'Second Camera ID é obrigatório quando position é diferente de 0';
        console.error(`❌ ${errorMsg}`);
        
        errorNotifier.sendNotification(
          id,
          4,
          'processReplay - Validação',
          {
            message: errorMsg,
            params: { id, position, secondCameraId },
            timestamp: new Date().toISOString()
          }
        );
        
        return res.status(400).json({ 
          success: false, 
          message: errorMsg 
        });
      }

      // 🔥 RESPONDER IMEDIATAMENTE
      res.status(202).json({
        success: true,
        message: 'Processamento iniciado',
        timestamp: new Date().toISOString()
      });

      // Processar em background
      this.processReplayBackground({
        id, subquadraId, position, quadraId, secondCameraId
      }).catch(error => {
        console.error('Erro no processamento em background (catch final):', error);
        
        // Reportar erro capturado aqui também
        errorNotifier.sendNotification(
          id || 'N/A',
          4,
          'processReplay - Catch Final',
          {
            message: error.message,
            params: { id, subquadraId, position, quadraId, secondCameraId },
            stack: error.stack,
            timestamp: new Date().toISOString()
          }
        );
      });

    } catch (error) {
      console.error('❌ Erro no processReplay:', error);
      
      // Reportar erro geral
      errorNotifier.sendNotification(
        req.query.id || 'N/A',
        4,
        'processReplay - Erro Geral',
        {
          message: error.message,
          stack: error.stack,
          url: req.url,
          query: req.query,
          timestamp: new Date().toISOString()
        }
      );
      
      res.status(500).json({
        success: false,
        message: 'Erro interno no servidor'
      });
    }
  }

  async processReplayBackground(params) {
    let tempFilesToCleanup = [];
    
    try {
      const { id, subquadraId, position, quadraId, secondCameraId } = params;
      
      console.log(`🔄 Processamento em background: ${id}`);
      
      // Delay inicial
      await new Promise(resolve => setTimeout(resolve, DELAY_BEFORE_PROCESSING));

      // Buscar perspectiva
      let perspectiva = 'horizontal';
      try {
        const quadraInfo = await databaseService.getQuadraPerspective(quadraId);
        perspectiva = quadraInfo?.perspectiva || 'horizontal';
        console.log(`📍 Perspectiva da quadra: ${perspectiva}`);
      } catch (error) {
        console.warn('⚠️ Erro ao buscar perspectiva:', error.message);
        
        // Reportar erro de perspectiva
        errorNotifier.sendNotification(
          id,
          4,
          'processReplayBackground - Perspectiva',
          {
            message: `Erro ao buscar perspectiva: ${error.message}`,
            quadraId: quadraId,
            error: error.message,
            warning: true,
            timestamp: new Date().toISOString()
          }
        );
      }

      const videoGroupCode = position !== '0' ? `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;

      // Processar baseado na posição
      if (position === '0') {
        await this.processCamera(id, subquadraId, quadraId, perspectiva, '0', null, tempFilesToCleanup);
      } else {
        await Promise.all([
          this.processCamera(id, subquadraId, quadraId, perspectiva, '1', videoGroupCode, tempFilesToCleanup),
          this.processCamera(secondCameraId, subquadraId, quadraId, perspectiva, '2', videoGroupCode, tempFilesToCleanup)
        ]);
      }

      // Notificação de sucesso
      const cameraId = position === '0' ? id : `${id},${secondCameraId}`;
      successNotifier.sendNotification(cameraId);

      console.log(`✅ Processamento concluído: ${cameraId}`);

    } catch (err) {
      console.error('❌ Erro no processamento em background:', err);
      
      // ✅ ENVIAR ERRO COM DETALHES PARA DIAGNÓSTICO
      const cameraId = params.id || 'N/A';
      const origem = 'ReplayServer';
      
      // Enviar notificação com TODOS os detalhes do erro
      errorNotifier.sendNotification(
        cameraId, 
        4, 
        'processReplayBackground - Erro Geral',
        {
          message: err.message,
          stack: err.stack,
          params: params,
          name: err.name,
          code: err.code,
          errno: err.errno,
          path: err.path,
          syscall: err.syscall,
          sqlMessage: err.sqlMessage,
          timestamp: new Date().toISOString()
        }
      );
      
      // Adicionar log detalhado no console também
      console.error('📋 DETALHES DO ERRO:');
      console.error('Mensagem:', err.message);
      console.error('Stack:', err.stack);
      if (err.code) console.error('Código:', err.code);
      if (err.path) console.error('Caminho:', err.path);
      if (err.errno) console.error('Errno:', err.errno);
      if (err.syscall) console.error('Syscall:', err.syscall);
      if (err.sqlMessage) console.error('SQL Message:', err.sqlMessage);
      
      // Limpar arquivos temporários em caso de erro
      if (tempFilesToCleanup.length > 0) {
        try {
          fileService.cleanupTempFiles(tempFilesToCleanup);
        } catch (cleanupError) {
          console.error('❌ Erro ao limpar arquivos temporários:', cleanupError);
        }
      }
    } finally {
      // Limpeza em background
      if (tempFilesToCleanup.length > 0) {
        setTimeout(() => {
          console.log('🧹 Limpeza de arquivos temporários');
          try {
            fileService.cleanupTempFiles(tempFilesToCleanup);
          } catch (cleanupError) {
            console.error('❌ Erro na limpeza em background:', cleanupError);
          }
        }, 30000);
      }
    }
  }

  async processCamera(cameraId, subquadraId, quadraId, perspectiva, position, groupCode, tempFiles) {
    console.log(`🎥 Processando câmera: ${cameraId} (posição ${position})`);
    
    const tempCopyPath = path.join(TEMP_DIR, `temp_${cameraId}_${Date.now()}.ts`);
    const outputPath = path.join(TEMP_DIR, `replay_${cameraId}_${Date.now()}.mp4`);
    const videoWithLogos = path.join(TEMP_DIR, `final_${cameraId}_${Date.now()}.mp4`);
    const finalVideoName = `replay-${cameraId}-${Date.now()}.mp4`;
    
    tempFiles.push(tempCopyPath, outputPath, videoWithLogos);

    try {
      // 1. Buscar vídeos recentes
      console.log(`🔍 Buscando vídeos para ${cameraId}...`);
      let recentVideos;
      try {
        recentVideos = fileService.listRecentVideos(cameraId);
        console.log(`📁 ${recentVideos.length} vídeos encontrados`);
      } catch (listError) {
        const erro = new Error(`Erro ao listar vídeos: ${listError.message}`);
        console.error(`❌ ${erro.message}`);
        
        await this.handleCameraError(
          cameraId,
          'Listagem de Vídeos',
          listError,
          {
            cameraId: cameraId,
            action: 'listRecentVideos',
            directory: `/home/Shinobi/videos/1/${cameraId}`,
            suggestion: 'Verificar se o diretório existe e se tem permissões'
          }
        );
        
        throw erro;
      }

      if (recentVideos.length === 0) {
        const erro = new Error(`Nenhum vídeo encontrado para ${cameraId}`);
        console.error(`❌ ${erro.message}`);
        
        await this.handleCameraError(
          cameraId,
          'Listagem de Vídeos - Sem Vídeos',
          erro,
          {
            cameraId: cameraId,
            errorType: 'NO_VIDEOS_FOUND',
            directory: `/home/Shinobi/videos/1/${cameraId}`,
            suggestion: 'Verificar se a câmera está gravando e se o diretório existe'
          }
        );
        
        throw erro;
      }

      const latestVideo = recentVideos[0];
      console.log(`📹 Último vídeo: ${latestVideo.name} (${latestVideo.size} bytes)`);

      // 2. Cópia segura
      console.log('📋 Fazendo cópia segura...');
      try {
        await fileService.safeCopyRecordingFile(latestVideo.path, tempCopyPath);
        console.log('✅ Cópia segura concluída');
      } catch (copyError) {
        const erro = new Error(`Erro na cópia do vídeo: ${copyError.message}`);
        console.error(`❌ ${erro.message}`);
        
        await this.handleCameraError(
          cameraId,
          'Cópia Segura',
          copyError,
          {
            cameraId: cameraId,
            sourcePath: latestVideo.path,
            destPath: tempCopyPath,
            videoName: latestVideo.name,
            videoSize: latestVideo.size,
            action: 'safeCopyRecordingFile'
          }
        );
        
        throw erro;
      }

      // 3. Capturar ÚLTIMOS 30 segundos
      console.log('⏱️ Capturando ÚLTIMOS 30 segundos...');
      try {
        await videoService.captureLastSeconds(tempCopyPath, outputPath, 30);
        console.log('✅ Captura de 30s concluída');
      } catch (captureError) {
        const erro = new Error(`Erro na captura dos últimos 30s: ${captureError.message}`);
        console.error(`❌ ${erro.message}`);
        
        await this.handleCameraError(
          cameraId,
          'Captura de Vídeo',
          captureError,
          {
            cameraId: cameraId,
            inputPath: tempCopyPath,
            outputPath: outputPath,
            duration: '30s',
            action: 'captureLastSeconds',
            suggestion: 'Verificar se o arquivo TS está corrompido'
          }
        );
        
        throw erro;
      }

      // 4. Adicionar logos COM PERSPECTIVA
      console.log(`🎨 Processando logos (${perspectiva})...`);
      try {
        await videoService.addLogosAndSponsorsToVideo(
          outputPath, videoWithLogos, quadraId, perspectiva,
          sponsorService, fileService, databaseService
        );
        console.log('✅ Logos aplicados');
      } catch (logosError) {
        console.warn('⚠️ Erro nos logos, usando fallback...');
        
        // Enviar aviso para Telegram (não é erro crítico)
        errorNotifier.sendNotification(
          cameraId,
          2, // Tipo 2 = aviso
          'ProcessCamera - Logos',
          {
            message: `Erro nos logos, usando fallback: ${logosError.message}`,
            cameraId: cameraId,
            perspectiva: perspectiva,
            quadraId: quadraId,
            warning: 'LOGOS_FALLBACK',
            suggestion: 'Verificar arquivos de logos no servidor',
            timestamp: new Date().toISOString()
          }
        );
        
        try {
          await fileService.safeCopyRecordingFile(outputPath, videoWithLogos);
          console.log('✅ Fallback aplicado (vídeo sem logos)');
        } catch (fallbackError) {
          const erro = new Error(`Erro no fallback de logos: ${fallbackError.message}`);
          console.error(`❌ ${erro.message}`);
          
          await this.handleCameraError(
            cameraId,
            'Fallback Logos',
            fallbackError,
            {
              cameraId: cameraId,
              originalError: logosError.message,
              action: 'safeCopyRecordingFile (fallback)',
              suggestion: 'Verificar espaço em disco e permissões'
            }
          );
          
          throw erro;
        }
      }

      // 5. Mover para FTP
      console.log('📤 Movendo para FTP...');
      try {
        const videoUrl = await fileService.moveVideoToFTPDirectory(videoWithLogos, finalVideoName);
        console.log(`✅ Vídeo movido para FTP: ${videoUrl}`);
        
        // 6. Salvar no banco
        console.log('💾 Salvando no banco...');
        const tipo = position === '0' ? 1 : 2;
        try {
          await databaseService.saveVideoToDatabase(
            subquadraId, position, videoUrl, tipo, quadraId, groupCode
          );
          console.log('✅ Dados salvos no banco');
        } catch (dbError) {
          const erro = new Error(`Erro ao salvar no banco: ${dbError.message}`);
          console.error(`❌ ${erro.message}`);
          
          await this.handleCameraError(
            cameraId,
            'Banco de Dados',
            dbError,
            {
              cameraId: cameraId,
              subquadraId: subquadraId,
              position: position,
              tipo: tipo,
              quadraId: quadraId,
              groupCode: groupCode,
              videoUrl: videoUrl,
              action: 'saveVideoToDatabase',
              suggestion: 'Verificar conexão com banco de dados'
            }
          );
          
          throw erro;
        }
        
        // Retornar URL para uso externo se necessário
        return videoUrl;
        
      } catch (moveError) {
        const erro = new Error(`Erro ao mover/salvar vídeo: ${moveError.message}`);
        console.error(`❌ ${erro.message}`);
        
        // Verificar se é erro de FTP ou banco de dados
        const stage = moveError.message.includes('FTP') ? 'FTP' : 'Salvamento Geral';
        
        await this.handleCameraError(
          cameraId,
          stage,
          moveError,
          {
            cameraId: cameraId,
            videoPath: videoWithLogos,
            fileName: finalVideoName,
            subquadraId: subquadraId,
            quadraId: quadraId,
            position: position,
            action: 'moveVideoToFTPDirectory ou saveVideoToDatabase',
            suggestion: moveError.message.includes('FTP') ? 
              'Verificar conexão FTP e espaço em disco' : 
              'Verificar banco de dados'
          }
        );
        
        throw erro;
      }

      console.log(`✅ Câmera ${cameraId} finalizada com sucesso`);

    } catch (error) {
      // Erro geral não tratado acima
      console.error(`❌ Erro geral no processamento da câmera ${cameraId}:`, error);
      
      await this.handleCameraError(
        cameraId,
        'Erro Geral Não Tratado',
        error,
        {
          cameraId: cameraId,
          subquadraId: subquadraId,
          quadraId: quadraId,
          position: position,
          perspectiva: perspectiva,
          groupCode: groupCode,
          suggestion: 'Verificar logs completos no servidor'
        }
      );
      
      throw error; // Propagar o erro para o método chamador
    }
  }

  async handleCameraError(cameraId, stage, originalError, additionalData = {}) {
    console.error(`❌ Erro na câmera ${cameraId} (${stage}):`, originalError.message);
    
    // Preparar dados do erro para o Telegram
    const errorData = {
      message: originalError.message,
      cameraId: cameraId,
      stage: stage,
      timestamp: new Date().toISOString(),
      name: originalError.name,
      code: originalError.code,
      errno: originalError.errno,
      path: originalError.path,
      syscall: originalError.syscall,
      sqlMessage: originalError.sqlMessage,
      ...additionalData
    };
    
    // Adicionar stack trace se disponível (limitado para não exceder limite do Telegram)
    if (originalError.stack) {
      const stackLines = originalError.stack.split('\n').slice(0, 5);
      errorData.stack = stackLines.join('\n');
    }
    
    // Enviar para Telegram
    errorNotifier.sendNotification(cameraId, 4, `ProcessCamera - ${stage}`, errorData);
    
    // Log detalhado local
    console.error('📋 Detalhes do erro (local):', JSON.stringify(errorData, null, 2));
  }

  async processLiveStream(req, res) {
    try {
      const { cameraId, quadraId } = req.query;
      
      if (!cameraId || !quadraId) {
        const errorMsg = 'cameraId e quadraId são obrigatórios';
        console.error(`❌ ${errorMsg}`);
        
        errorNotifier.sendNotification(
          cameraId || 'N/A',
          4,
          'processLiveStream - Validação',
          {
            message: errorMsg,
            query: req.query,
            timestamp: new Date().toISOString()
          }
        );
        
        return res.status(400).json({
          success: false,
          message: errorMsg
        });
      }
      
      console.log(`📡 Iniciando live stream: ${cameraId}`);
      
      const streamUrl = await videoService.processLiveStreamWithSponsors(
        cameraId, 
        quadraId, 
        sponsorService, 
        databaseService
      );
      
      res.json({
        success: true,
        streamUrl,
        message: 'Live stream iniciado'
      });
      
    } catch (error) {
      console.error('❌ Erro no live stream:', error);
      
      errorNotifier.sendNotification(
        req.query.cameraId || 'N/A',
        4,
        'processLiveStream - Erro',
        {
          message: error.message,
          stack: error.stack,
          query: req.query,
          timestamp: new Date().toISOString()
        }
      );
      
      res.status(500).json({
        success: false,
        message: 'Erro ao iniciar live stream'
      });
    }
  }

  async generateHLSPreview(req, res) {
    try {
      const { cameraId, quadraId } = req.query;
      
      if (!cameraId || !quadraId) {
        const errorMsg = 'cameraId e quadraId são obrigatórios';
        console.error(`❌ ${errorMsg}`);
        
        errorNotifier.sendNotification(
          cameraId || 'N/A',
          4,
          'generateHLSPreview - Validação',
          {
            message: errorMsg,
            query: req.query,
            timestamp: new Date().toISOString()
          }
        );
        
        return res.status(400).json({
          success: false,
          message: errorMsg
        });
      }
      
      console.log(`🎬 Gerando preview HLS: ${cameraId}`);
      
      const previewData = await videoService.generateHLSPreview(
        cameraId,
        quadraId,
        sponsorService,
        databaseService
      );
      
      res.json({
        success: true,
        ...previewData,
        message: 'Preview HLS gerado'
      });
      
    } catch (error) {
      console.error('❌ Erro no preview HLS:', error);
      
      errorNotifier.sendNotification(
        req.query.cameraId || 'N/A',
        4,
        'generateHLSPreview - Erro',
        {
          message: error.message,
          stack: error.stack,
          query: req.query,
          timestamp: new Date().toISOString()
        }
      );
      
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar preview HLS'
      });
    }
  }
}

module.exports = new ReplayController();