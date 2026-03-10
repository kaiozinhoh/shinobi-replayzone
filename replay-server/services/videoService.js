const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const renderService = require('./renderService');

class VideoService {
  captureLastSeconds(inputPath, outputPath, seconds) {
    return new Promise((resolve, reject) => {
      console.log(`🎬 Capturando ÚLTIMOS ${seconds}s de: ${path.basename(inputPath)}`);
      
      // 🔥 CORREÇÃO: Método correto para pegar últimos segundos
      // Primeiro obter a duração total do vídeo
      const getDurationCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`;
      
      exec(getDurationCommand, (durationErr, durationStdout) => {
        if (durationErr || !durationStdout) {
          console.warn('⚠️ Não conseguiu obter duração, usando método alternativo');
          // Método alternativo
          return this.captureWithSseof(inputPath, outputPath, seconds, resolve, reject);
        }

        const totalDuration = parseFloat(durationStdout);
        console.log(`⏱️ Duração total: ${totalDuration.toFixed(2)}s`);
        
        if (totalDuration <= seconds) {
          // Se o vídeo é menor que os segundos solicitados, usar vídeo completo
          console.log('📹 Vídeo mais curto, usando completo');
          return this.copyFullVideo(inputPath, outputPath, resolve, reject);
        }

        // Calcular start time para pegar últimos X segundos
        const startTime = totalDuration - seconds;
        console.log(`⏰ Iniciando em: ${startTime.toFixed(2)}s`);
        
        // 🔥 COMANDO CORRETO: -ss com tempo específico
        const command = `ffmpeg -loglevel error -ss ${startTime} -i "${inputPath}" -t ${seconds} -c copy -avoid_negative_ts make_zero -y "${outputPath}"`;
        
        console.log(`⚡ Executando: ffmpeg -ss ${startTime.toFixed(2)} -i [arquivo] -t ${seconds} -c copy`);
        
        exec(command, (err) => {
          if (err) {
            console.error('❌ Erro na captura precisa:', err.message);
            // Fallback para método sseof
            this.captureWithSseof(inputPath, outputPath, seconds, resolve, reject);
          } else {
            this.validateOutput(outputPath, resolve, reject);
          }
        });
      });
    });
  }

  captureWithSseof(inputPath, outputPath, seconds, resolve, reject) {
    console.log('🔄 Usando método SSEOF para últimos segundos');
    const command = `ffmpeg -loglevel error -sseof -${seconds} -i "${inputPath}" -c copy -avoid_negative_ts make_zero -y "${outputPath}"`;
    
    exec(command, (err) => {
      if (err) {
        console.error('❌ Erro no SSEOF:', err.message);
        // Último fallback: pegar do início
        this.copyFullVideo(inputPath, outputPath, resolve, reject);
      } else {
        this.validateOutput(outputPath, resolve, reject);
      }
    });
  }

  copyFullVideo(inputPath, outputPath, resolve, reject) {
    console.log('📋 Copiando vídeo completo');
    const command = `ffmpeg -loglevel error -i "${inputPath}" -c copy -y "${outputPath}"`;
    
    exec(command, (err) => {
      if (err) {
        reject(err);
      } else {
        this.validateOutput(outputPath, resolve, reject);
      }
    });
  }

  validateOutput(outputPath, resolve, reject) {
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`📊 Arquivo gerado: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
        
        if (stats.size > 102400) {
          // Verificar duração real
          const checkCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`;
          
          exec(checkCommand, (checkErr, checkStdout) => {
            if (!checkErr && checkStdout) {
              const duration = parseFloat(checkStdout);
              console.log(`⏱️ Duração do replay: ${duration.toFixed(2)}s`);
            }
            resolve(outputPath);
          });
        } else {
          reject(new Error('Vídeo muito pequeno'));
        }
      } else {
        reject(new Error('Arquivo não criado'));
      }
    }, 1500);
  }

async addLogosAndSponsorsToVideo(inputPath, outputPath, quadraId, perspectiva, sponsorService, fileService, databaseService) {
  console.log(`🎨 Aplicando overlays (${perspectiva}): ${path.basename(inputPath)}`);
  
  if (!fs.existsSync(inputPath)) {
    throw new Error('Arquivo de entrada não existe');
  }

  try {
    // 🔥 CORREÇÃO: Aguardar um pouco antes de processar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const resultPath = await renderService.processVideoWithOverlays(inputPath, outputPath, quadraId, perspectiva);
    console.log('✅ Overlays aplicados com sucesso');
    return resultPath;
  } catch (error) {
    console.warn('⚠️ Erro ao processar overlays, usando fallback...');
    
    // 🔥 CORREÇÃO: Fallback mais robusto
    try {
      // Tentar copiar com rotação simples se for vertical
      if (perspectiva === 'vertical') {
        const { spawn } = require('child_process');
        const args = [
          '-loglevel', 'error',
          '-i', inputPath,
          '-vf', 'transpose=2',
          '-c:a', 'copy',
          '-y', outputPath
        ];
        
        await new Promise((resolve, reject) => {
          const process = spawn('ffmpeg', args);
          process.on('close', (code) => code === 0 ? resolve() : reject());
          process.on('error', reject);
        });
        console.log('✅ Fallback com rotação aplicada');
      } else {
        // Apenas copiar
        fs.copyFileSync(inputPath, outputPath);
        console.log('✅ Fallback simples - vídeo copiado');
      }
      return outputPath;
    } catch (fallbackError) {
      console.error('❌ Fallback também falhou, usando cópia direta');
      fs.copyFileSync(inputPath, outputPath);
      return outputPath;
    }
  }
}

  processLiveStreamWithSponsors(cameraId, quadraId, sponsorService, databaseService) {
    return new Promise((resolve, reject) => {
      console.log(`📡 Configurando live stream: ${cameraId}`);
      
      const outputDir = `/tmp/hls/${cameraId}`;
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputFile = path.join(outputDir, 'index.m3u8');
      
      const streamUrl = `rtsp://${cameraId}/stream`;
      const command = `ffmpeg -loglevel error -i "${streamUrl}" -c:v libx264 -preset veryfast -c:a aac -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments -y "${outputFile}"`;
      
      exec(command, (err) => {
        if (err) {
          reject(err);
        } else {
          const streamUrlAccess = `https://seu-servidor.com/hls/${cameraId}/index.m3u8`;
          resolve(streamUrlAccess);
        }
      });
    });
  }

  generateHLSPreview(cameraId, quadraId, sponsorService, databaseService) {
    return new Promise((resolve, reject) => {
      console.log(`🎬 Gerando preview HLS: ${cameraId}`);
      
      const outputDir = `/tmp/hls-preview/${cameraId}`;
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputFile = path.join(outputDir, 'index.m3u8');
      
      const command = `ffmpeg -loglevel error -f lavfi -i testsrc=duration=30:size=1280x720:rate=30 -c:v libx264 -preset fast -c:a aac -f hls -hls_time 2 -hls_list_size 10 -y "${outputFile}"`;
      
      exec(command, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            previewUrl: `https://seu-servidor.com/hls-preview/${cameraId}/index.m3u8`,
            segments: outputDir,
            duration: 30
          });
        }
      });
    });
  }
}

module.exports = new VideoService();