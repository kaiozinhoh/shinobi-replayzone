const fs = require('fs');
const path = require('path');
const { VIDEO_BASE_PATH, GROUP_KEY, TEMP_DIR, FTP_VIDEOS_PATH } = require('../config/constants');

class FileService {
  ensureDirectoriesExist() {
    console.log('📁 Verificando diretórios...');
    
    [TEMP_DIR, FTP_VIDEOS_PATH].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Criado: ${dir}`);
      }
    });
  }

  listRecentVideos(cameraId) {
    console.log(`🔍 Buscando vídeos: ${cameraId}`);
    const cameraPath = path.join(VIDEO_BASE_PATH, GROUP_KEY, cameraId);
    
    if (!fs.existsSync(cameraPath)) {
      throw new Error(`Câmera não encontrada: ${cameraPath}`);
    }

    const files = fs.readdirSync(cameraPath)
      .filter(file => file.endsWith('.ts'))
      .map(file => ({
        name: file,
        path: path.join(cameraPath, file),
        ctime: fs.statSync(path.join(cameraPath, file)).ctime
      }))
      .sort((a, b) => b.ctime - a.ctime);

    console.log(`📁 ${files.length} vídeos encontrados`);
    return files;
  }

  async safeCopyRecordingFile(sourcePath, destPath) {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(sourcePath);
      const writeStream = fs.createWriteStream(destPath);
      
      writeStream.on('finish', () => resolve(destPath));
      writeStream.on('error', reject);
      readStream.on('error', reject);
      
      readStream.pipe(writeStream);
    });
  }

  async moveVideoToFTPDirectory(videoPath, videoName) {
    const targetPath = path.join(FTP_VIDEOS_PATH, videoName);
    
    // Garantir diretório
    const destDir = path.dirname(targetPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    await fs.promises.rename(videoPath, targetPath);
    return `https://cam.replayzone.com.br/videos/${videoName}`;
  }

  cleanupTempFiles(files) {
    console.log(`🧹 Limpando ${files.length} arquivos`);
    let removed = 0;
    
    files.forEach(file => {
      try {
        if (file && fs.existsSync(file)) {
          fs.unlinkSync(file);
          removed++;
        }
      } catch (error) {
        // Ignorar erros na limpeza
      }
    });
    
    console.log(`✅ ${removed} arquivos removidos`);
  }
}

module.exports = new FileService();