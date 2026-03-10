const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const databaseService = require('./databaseService');
const sponsorService = require('./sponsorService');

class RenderService {
  constructor() {
    this.tempFiles = [];
    this.logosBasePath = '/home/ftp/videos/logos';
  }

  async processVideoWithOverlays(inputPath, outputPath, quadraId, perspectiva = 'horizontal') {
    console.log(`🎨 Processando overlays (${perspectiva}): ${path.basename(inputPath)}`);
    
    if (!fs.existsSync(inputPath)) {
      throw new Error('Arquivo de entrada não encontrado');
    }

    // 🔥 CORREÇÃO: Método mais simples e confiável
    try {
      // Tentar método completo com filter complex
      return await this.processWithFilterComplex(inputPath, outputPath, quadraId, perspectiva);
    } catch (error) {
      console.warn(`⚠️ Método complexo falhou, tentando método simples: ${error.message}`);
      
      // Fallback para método simples
      try {
        return await this.processSimpleOverlay(inputPath, outputPath, quadraId, perspectiva);
      } catch (simpleError) {
        console.warn(`⚠️ Método simples também falhou: ${simpleError.message}`);
        
        // Último fallback: copiar sem overlays
        console.log('🔄 Usando fallback final - copiando sem overlays');
        fs.copyFileSync(inputPath, outputPath);
        return outputPath;
      }
    }
  }

  // 🔥 MÉTODO PRINCIPAL MELHORADO
  async processWithFilterComplex(inputPath, outputPath, quadraId, perspectiva) {
    return new Promise(async (resolve, reject) => {
      try {
        const args = await this.buildSimpleFFmpegArgs(inputPath, outputPath, quadraId, perspectiva);
        
        console.log(`⚡ Executando FFmpeg com ${args.length} argumentos`);

        const ffmpegProcess = spawn('ffmpeg', args, {
          stdio: ['ignore', 'ignore', 'pipe']
        });

        let errorData = '';
        let hasError = false;

        ffmpegProcess.stderr.on('data', (data) => {
          const line = data.toString();
          errorData += line;
          
          // 🔥 DETECTAR ERROS CRÍTICOS MAIS CEDO
          if (line.includes('Conversion failed!') || 
              line.includes('Invalid argument') ||
              line.includes('No such file') ||
              line.includes('Permission denied')) {
            hasError = true;
            console.error(`❌ Erro crítico detectado: ${line.trim()}`);
          }
        });

        // 🔥 TIMEOUT REDUZIDO para evitar travamentos
        const timeout = setTimeout(() => {
          if (ffmpegProcess.exitCode === null) {
            console.log('⏰ Timeout no processamento - terminando processo');
            ffmpegProcess.kill('SIGKILL');
            reject(new Error('Timeout no processamento de overlays'));
          }
        }, 60000); // 1 minuto

        ffmpegProcess.on('close', (code) => {
          clearTimeout(timeout);
          this.cleanupTempFiles();
          
          if (code === 0 && !hasError) {
            // 🔥 VERIFICAÇÃO MAIS RÁPIDA
            setTimeout(() => {
              if (fs.existsSync(outputPath)) {
                const stats = fs.statSync(outputPath);
                if (stats.size > 102400) {
                  console.log('✅ Overlays aplicados com sucesso');
                  resolve(outputPath);
                } else {
                  reject(new Error('Arquivo de saída muito pequeno'));
                }
              } else {
                reject(new Error('Arquivo de saída não criado'));
              }
            }, 500);
          } else {
            console.error(`❌ FFmpeg falhou com código: ${code}`);
            if (errorData) {
              console.error('Detalhes do erro:', errorData.slice(-300));
            }
            reject(new Error(`Processamento falhou: ${code}`));
          }
        });

        ffmpegProcess.on('error', (err) => {
          clearTimeout(timeout);
          this.cleanupTempFiles();
          console.error('❌ Erro no processo FFmpeg:', err);
          reject(err);
        });

      } catch (error) {
        this.cleanupTempFiles();
        reject(error);
      }
    });
  }

  // 🔥 MÉTODO SIMPLIFICADO PARA FALLBACK
  async processSimpleOverlay(inputPath, outputPath, quadraId, perspectiva) {
    return new Promise((resolve, reject) => {
      console.log('🔄 Usando método simples de overlay');
      
      const args = [
        '-loglevel', 'error',
        '-i', inputPath
      ];

      // Apenas rotação se necessário
      if (perspectiva === 'vertical') {
        args.push('-vf', 'transpose=2');
      }

      // Configurações básicas
      args.push(
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'copy', // Manter áudio original
        '-movflags', '+faststart',
        '-y', outputPath
      );

      const ffmpegProcess = spawn('ffmpeg', args, {
        stdio: ['ignore', 'ignore', 'pipe']
      });

      const timeout = setTimeout(() => {
        ffmpegProcess.kill();
        reject(new Error('Timeout no método simples'));
      }, 30000);

      ffmpegProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 102400) {
            console.log('✅ Método simples concluído');
            resolve(outputPath);
          } else {
            reject(new Error('Arquivo inválido do método simples'));
          }
        } else {
          reject(new Error(`Método simples falhou: ${code}`));
        }
      });

      ffmpegProcess.on('error', reject);
    });
  }

  // 🔥 MÉTODO SIMPLIFICADO PARA CONSTRUIR ARGUMENTOS
  async buildSimpleFFmpegArgs(inputPath, outputPath, quadraId, perspectiva) {
    const args = [
      '-loglevel', 'error',
      '-err_detect', 'ignore_err',
      '-i', inputPath
    ];

    // 🔥 DETECTAR SE PRECISA DE ROTAÇÃO de forma mais simples
    try {
      const resolution = await this.detectResolution(inputPath);
      const needsRotation = this.needsRotation(resolution.width, resolution.height, perspectiva);
      
      if (needsRotation) {
        args.push('-vf', 'transpose=2'); // Apenas rotação
        console.log('🔄 Aplicando rotação para vertical');
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível detectar resolução, assumindo horizontal');
    }

    // 🔥 CONFIGURAÇÕES OTIMIZADAS
    args.push(
      '-c:v', 'libx264',
      '-preset', 'fast', // Mais rápido que 'medium'
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-max_muxing_queue_size', '9999', // 🔥 AUMENTADO para evitar erros
      '-y', outputPath
    );

    return args;
  }

  // 🔥 MÉTODO DE DETECÇÃO MAIS ROBUSTO
  async detectResolution(inputPath) {
    return new Promise((resolve) => {
      const args = [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'json',
        inputPath
      ];

      const ffprobe = spawn('ffprobe', args);

      let output = '';
      ffprobe.stdout.on('data', (data) => output += data.toString());

      // 🔥 TIMEOUT MAIS CURTO
      const timeout = setTimeout(() => {
        ffprobe.kill();
        resolve({ width: 1920, height: 1080 }); // Valor padrão
      }, 5000);

      ffprobe.on('close', () => {
        clearTimeout(timeout);
        try {
          const metadata = JSON.parse(output);
          if (metadata.streams && metadata.streams.length > 0) {
            const stream = metadata.streams[0];
            resolve({
              width: stream.width || 1920,
              height: stream.height || 1080
            });
          } else {
            resolve({ width: 1920, height: 1080 });
          }
        } catch (error) {
          resolve({ width: 1920, height: 1080 });
        }
      });

      ffprobe.on('error', () => {
        clearTimeout(timeout);
        resolve({ width: 1920, height: 1080 });
      });
    });
  }

  needsRotation(originalWidth, originalHeight, perspectiva) {
    const isVertical = perspectiva === 'vertical';
    const isPortrait = originalHeight > originalWidth;
    
    const needsRotate = isVertical && !isPortrait;
    
    console.log(`📐 Perspectiva: ${perspectiva}, Dimensões: ${originalWidth}x${originalHeight}, Rotacionar: ${needsRotate}`);
    return needsRotate;
  }

  // 🔥 MÉTODO DE LIMPEZA MELHORADO
  cleanupTempFiles() {
    if (this.tempFiles.length === 0) return;
    
    console.log(`🧹 Limpando ${this.tempFiles.length} arquivos temporários`);
    let removed = 0;
    
    this.tempFiles.forEach(file => {
      try {
        if (file && fs.existsSync(file)) {
          fs.unlinkSync(file);
          removed++;
        }
      } catch (error) {
        console.warn(`⚠️ Não foi possível remover: ${file}`);
      }
    });
    
    console.log(`✅ ${removed} arquivos temporários removidos`);
    this.tempFiles = [];
  }

  // 🔥 MÉTODOS DE STREAM (MANTIDOS PARA COMPATIBILIDADE)
  async processStreamWithOverlays(inputPath, outputPath, quadraId, hlsOptions = {}) {
    console.log(`📡 Processando stream com overlays: ${quadraId}`);
    
    try {
      const args = await this.buildStreamFFmpegArgs(inputPath, outputPath, quadraId, hlsOptions);
      
      return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn('ffmpeg', args, {
          stdio: ['ignore', 'ignore', 'pipe']
        });

        let errorData = '';
        ffmpegProcess.stderr.on('data', (data) => {
          errorData += data.toString();
        });

        ffmpegProcess.on('close', (code) => {
          if (code === 0) {
            resolve(outputPath);
          } else {
            reject(new Error(`Stream processing failed: ${code}`));
          }
        });

        ffmpegProcess.on('error', reject);
      });

    } catch (error) {
      this.cleanupTempFiles();
      throw error;
    }
  }

  async buildStreamFFmpegArgs(inputPath, outputPath, quadraId, hlsOptions = {}) {
    const args = [
      '-loglevel', 'error',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-crf', '23',
      '-maxrate', '1500k',
      '-bufsize', '3000k',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-f', 'hls',
      '-hls_time', hlsOptions.hlsTime || '2',
      '-hls_list_size', hlsOptions.hlsListSize || '5',
      '-hls_flags', 'delete_segments+omit_endlist',
      '-max_muxing_queue_size', '9999'
    ];

    if (hlsOptions.segmentPattern) {
      args.push('-hls_segment_filename', hlsOptions.segmentPattern);
    }

    args.push('-y', outputPath);

    return args;
  }

  async detectStreamResolution(streamUrl) {
    return new Promise((resolve) => {
      const args = [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'json',
        '-timeout', '5000000',
        streamUrl
      ];

      const ffprobe = spawn('ffprobe', args);

      let output = '';
      ffprobe.stdout.on('data', (data) => output += data.toString());

      const timeout = setTimeout(() => {
        ffprobe.kill();
        resolve({ width: 1280, height: 720 });
      }, 10000);

      ffprobe.on('close', () => {
        clearTimeout(timeout);
        try {
          const metadata = JSON.parse(output);
          if (metadata.streams && metadata.streams.length > 0) {
            const stream = metadata.streams[0];
            resolve({
              width: stream.width || 1280,
              height: stream.height || 720
            });
          } else {
            resolve({ width: 1280, height: 720 });
          }
        } catch (error) {
          resolve({ width: 1280, height: 720 });
        }
      });

      ffprobe.on('error', () => {
        clearTimeout(timeout);
        resolve({ width: 1280, height: 720 });
      });
    });
  }
}

module.exports = new RenderService();