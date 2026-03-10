const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const databaseService = require('./databaseService');
const errorNotifier = require('../telegram/notifications/errorNotifier');
const renderService = require('./renderService');
const { HLS_DIR } = require('../config/constants');

class PreviewService {
  constructor() {
    this.activePreviews = new Map();
    this.viewerCount = new Map();
    this.viewerTimeouts = new Map();
    this.hlsOutputDir = HLS_DIR;
    
    if (!fs.existsSync(this.hlsOutputDir)) {
      fs.mkdirSync(this.hlsOutputDir, { recursive: true });
    }
  }

  // Métodos para controle de visualizadores
  registerViewer(cameraId) {
    const currentCount = this.viewerCount.get(cameraId) || 0;
    this.viewerCount.set(cameraId, currentCount + 1);
    
    console.log(`👁️  Visualizador acessou ${cameraId}. Total: ${currentCount + 1}`);
    
    // Limpar timeout anterior se existir
    if (this.viewerTimeouts.has(cameraId)) {
      clearTimeout(this.viewerTimeouts.get(cameraId));
      this.viewerTimeouts.delete(cameraId);
    }
    
    return currentCount + 1;
  }

  removeViewer(cameraId) {
    const currentCount = this.viewerCount.get(cameraId) || 0;
    if (currentCount > 0) {
      this.viewerCount.set(cameraId, currentCount - 1);
      console.log(`👋 Visualizador saiu de ${cameraId}. Restantes: ${currentCount - 1}`);
      
      // Se não há mais visualizadores, agendar parada
      if (currentCount - 1 === 0) {
        this.scheduleStopPreview(cameraId);
      }
    }
  }

  scheduleStopPreview(cameraId) {
    // Limpar timeout anterior
    if (this.viewerTimeouts.has(cameraId)) {
      clearTimeout(this.viewerTimeouts.get(cameraId));
    }
    
    const timeout = setTimeout(() => {
      if ((this.viewerCount.get(cameraId) || 0) === 0 && this.activePreviews.has(cameraId)) {
        console.log(`🛑 Parando stream ${cameraId} (sem visualizadores)`);
        this.stopPreview(cameraId);
      }
      this.viewerTimeouts.delete(cameraId);
    }, 30000); // 30 segundos
    
    this.viewerTimeouts.set(cameraId, timeout);
  }

  // Método principal para garantir stream disponível
  async ensureStreamAvailable(cameraId) {
    console.log(`🔍 Verificando stream para: ${cameraId}`);
    
    // Se já está ativo, retornar URL
    if (this.activePreviews.has(cameraId)) {
      console.log(`✅ Stream já ativo para: ${cameraId}`);
      return this.getPreviewUrl(cameraId);
    }
    
    // Buscar informações da subquadra para obter quadra_id
    console.log(`🔎 Buscando subquadra para: ${cameraId}`);
    const subquadra = await databaseService.getSubquadraByCameraId(cameraId);
    
    if (!subquadra) {
      console.log(`❌ Subquadra não encontrada para: ${cameraId}`);
      throw new Error(`Subquadra não encontrada para cameraId: ${cameraId}`);
    }
    
    const quadraId = subquadra.quadra_id;
    console.log(`🎯 Quadra ID encontrada: ${quadraId} para camera: ${cameraId}`);
    
    // Se não está ativo, iniciar
    try {
      console.log(`🚀 Iniciando stream sob demanda para: ${cameraId}`);
      const hlsUrl = await this.startPreview(cameraId, quadraId);
      
      // Aguardar alguns segundos para o stream estabilizar
      console.log(`⏳ Aguardando estabilização do stream...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log(`✅ Stream iniciado: ${hlsUrl}`);
      return hlsUrl;
      
    } catch (error) {
      console.error(`❌ Erro ao iniciar stream sob demanda:`, error);
      
      // Tentar fallback sem logos
      console.log(`🔄 Tentando fallback sem logos...`);
      try {
        const fallbackUrl = await this.startPreviewWithoutLogos(cameraId, quadraId);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(`✅ Fallback iniciado: ${fallbackUrl}`);
        return fallbackUrl;
      } catch (fallbackError) {
        console.error(`❌ Fallback também falhou:`, fallbackError);
        throw new Error(`Não foi possível iniciar stream: ${fallbackError.message}`);
      }
    }
  }

  // Método para iniciar preview COM logos
  async startPreview(cameraId, quadraId) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`🎬 Iniciando preview COM logos: ${cameraId}`);
        
        const outputDir = path.join(this.hlsOutputDir, `preview-${cameraId}`);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputFile = path.join(outputDir, 'index.m3u8');
        const segmentPattern = path.join(outputDir, 'segment%03d.ts');

        // URL do stream de origem (ajuste conforme sua configuração)
        const inputStream = `http://localhost:8888/live/${cameraId}/index.m3u8`;
        console.log(`📡 Stream de entrada: ${inputStream}`);

        // 🔥 CORREÇÃO: Usar método direto do FFmpeg em vez do renderService
        const args = await this.buildStreamArgs(inputStream, outputFile, quadraId, segmentPattern);
        
        console.log(`⚡ Executando FFmpeg para: ${cameraId}`);
        
        const ffmpegProcess = spawn('ffmpeg', args, {
          stdio: ['ignore', 'ignore', 'pipe']
        });

        let errorData = '';
        ffmpegProcess.stderr.on('data', (data) => {
          const line = data.toString();
          errorData += line;
          
          // Log apenas erros importantes
          if (line.includes('Error') || line.includes('error')) {
            console.error(`❌ FFmpeg error (${cameraId}): ${line.trim()}`);
          }
        });

        const hlsUrl = `/hls/preview-${cameraId}/index.m3u8`;

        // Timeout para verificar se o stream iniciou
        const startupTimeout = setTimeout(() => {
          if (fs.existsSync(outputFile)) {
            console.log(`✅ Stream ${cameraId} iniciado com sucesso`);
            this.activePreviews.set(cameraId, {
              process: ffmpegProcess,
              startTime: Date.now(),
              hlsDir: outputDir,
              url: hlsUrl,
              quadraId: quadraId
            });
            resolve(hlsUrl);
          } else {
            console.error(`❌ Stream ${cameraId} não criou arquivo HLS`);
            ffmpegProcess.kill();
            reject(new Error('Stream não criou arquivo HLS dentro do timeout'));
          }
        }, 10000);

        ffmpegProcess.on('close', (code) => {
          clearTimeout(startupTimeout);
          console.log(`🔚 FFmpeg fechado (${cameraId}): código ${code}`);
          this.cleanupHlsDir(outputDir);
          this.activePreviews.delete(cameraId);
          this.viewerCount.delete(cameraId);
          this.viewerTimeouts.delete(cameraId);
          
          if (code !== 0 && code !== null) {
            console.error(`❌ FFmpeg falhou (${cameraId}): código ${code}`);
          }
        });

        ffmpegProcess.on('error', (err) => {
          clearTimeout(startupTimeout);
          console.error(`❌ Erro no processo FFmpeg (${cameraId}):`, err);
          this.cleanupHlsDir(outputDir);
          reject(err);
        });

      } catch (error) {
        console.error(`❌ Erro ao iniciar preview ${cameraId}:`, error);
        reject(error);
      }
    });
  }

  // Método para construir argumentos do FFmpeg
  async buildStreamArgs(inputStream, outputFile, quadraId, segmentPattern) {
    // Buscar perspectiva
    let perspectiva = 'horizontal';
    try {
      const quadraInfo = await databaseService.getQuadraPerspective(quadraId);
      perspectiva = quadraInfo?.perspectiva || 'horizontal';
      console.log(`📐 Perspectiva: ${perspectiva}`);
    } catch (error) {
      console.warn('⚠️ Erro ao buscar perspectiva:', error.message);
    }

    const args = [
      '-loglevel', 'error',
      '-i', inputStream
    ];

    // Adicionar rotação se for vertical
    if (perspectiva === 'vertical') {
      args.push('-vf', 'transpose=2'); // Rotação para vertical
      console.log('🔄 Aplicando rotação para vertical');
    }

    // Configurações HLS otimizadas
    args.push(
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-crf', '23',
      '-maxrate', '1500k',
      '-bufsize', '3000k',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-f', 'hls',
      '-hls_time', '2',
      '-hls_list_size', '5',
      '-hls_segment_filename', segmentPattern,
      '-hls_flags', 'delete_segments+omit_endlist',
      '-max_muxing_queue_size', '1024',
      '-y', outputFile
    );

    return args;
  }

  // Método fallback SEM logos
  async startPreviewWithoutLogos(cameraId, quadraId) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`🎬 Iniciando preview SEM logos: ${cameraId}`);
        
        const outputDir = path.join(this.hlsOutputDir, `preview-${cameraId}`);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputFile = path.join(outputDir, 'index.m3u8');
        const segmentPattern = path.join(outputDir, 'segment%03d.ts');
        const inputStream = `http://localhost:8888/live/${cameraId}/index.m3u8`;

        console.log(`📡 Stream de entrada (fallback): ${inputStream}`);

        // Argumentos simplificados sem overlays
        const args = [
          '-loglevel', 'error',
          '-i', inputStream,
          '-c', 'copy', // Apenas copiar, sem re-encode
          '-f', 'hls',
          '-hls_time', '2',
          '-hls_list_size', '5',
          '-hls_segment_filename', segmentPattern,
          '-hls_flags', 'delete_segments+omit_endlist',
          '-y', outputFile
        ];

        console.log(`⚡ Executando FFmpeg fallback para: ${cameraId}`);
        
        const ffmpegProcess = spawn('ffmpeg', args, {
          stdio: ['ignore', 'ignore', 'pipe']
        });

        let errorData = '';
        ffmpegProcess.stderr.on('data', (data) => {
          const line = data.toString();
          errorData += line;
          if (line.includes('Error') || line.includes('error')) {
            console.error(`❌ FFmpeg fallback error (${cameraId}): ${line.trim()}`);
          }
        });

        const hlsUrl = `/hls/preview-${cameraId}/index.m3u8`;

        const startupTimeout = setTimeout(() => {
          if (fs.existsSync(outputFile)) {
            console.log(`✅ Fallback ${cameraId} iniciado com sucesso`);
            this.activePreviews.set(cameraId, {
              process: ffmpegProcess,
              startTime: Date.now(),
              hlsDir: outputDir,
              url: hlsUrl,
              quadraId: quadraId
            });
            resolve(hlsUrl);
          } else {
            console.error(`❌ Fallback ${cameraId} não criou arquivo HLS`);
            ffmpegProcess.kill();
            reject(new Error('Fallback não criou arquivo HLS'));
          }
        }, 10000);

        ffmpegProcess.on('close', (code) => {
          clearTimeout(startupTimeout);
          console.log(`🔚 FFmpeg fallback fechado (${cameraId}): código ${code}`);
          this.cleanupHlsDir(outputDir);
          this.activePreviews.delete(cameraId);
        });

        ffmpegProcess.on('error', (err) => {
          clearTimeout(startupTimeout);
          console.error(`❌ Erro no fallback FFmpeg (${cameraId}):`, err);
          this.cleanupHlsDir(outputDir);
          reject(err);
        });

      } catch (error) {
        console.error(`❌ Erro no fallback ${cameraId}:`, error);
        reject(error);
      }
    });
  }

  // Método para limpar diretório HLS
  cleanupHlsDir(hlsDir) {
    try {
      if (fs.existsSync(hlsDir)) {
        fs.rmSync(hlsDir, { recursive: true, force: true });
        console.log(`🧹 Diretório HLS limpo: ${hlsDir}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao limpar diretório HLS ${hlsDir}:`, error);
    }
  }

  // Método para parar o preview
  async stopPreview(cameraId) {
    if (this.activePreviews.has(cameraId)) {
      const preview = this.activePreviews.get(cameraId);
      preview.process.kill('SIGTERM');
      
      // Aguardar um pouco antes de limpar
      setTimeout(() => {
        this.cleanupHlsDir(preview.hlsDir);
      }, 1000);
      
      this.activePreviews.delete(cameraId);
      this.viewerCount.delete(cameraId);
      this.viewerTimeouts.delete(cameraId);
      console.log(`🛑 Preview parado para câmera ${cameraId}`);
    }
  }

  getPreviewUrl(cameraId) {
    const preview = this.activePreviews.get(cameraId);
    return preview ? preview.url : null;
  }

  // Método para obter streams ativos
  getActiveStreams() {
    return Array.from(this.activePreviews.keys());
  }

  // Método para obter contagem de visualizadores
  getViewerCounts() {
    return Object.fromEntries(this.viewerCount);
  }

  // Método para verificar status do stream
  async checkStreamStatus(cameraId) {
    try {
      const testUrl = `http://localhost:8888/live/${cameraId}/index.m3u8`;
      const curlProcess = spawn('curl', ['-I', '--connect-timeout', '3', testUrl]);
      
      return new Promise((resolve) => {
        let output = '';
        
        curlProcess.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        curlProcess.on('close', (code) => {
          resolve(code === 0 && output.includes('HTTP/1.1 200'));
        });
        
        curlProcess.on('error', () => {
          resolve(false);
        });
        
        setTimeout(() => {
          curlProcess.kill();
          resolve(false);
        }, 3000);
      });
    } catch (error) {
      return false;
    }
  }
}

module.exports = new PreviewService();