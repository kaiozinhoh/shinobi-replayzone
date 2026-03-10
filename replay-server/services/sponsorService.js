const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { TEMP_DIR } = require('../config/constants');

class SponsorService {
  async downloadSponsorLogo(logoUrl, sponsorId) {
    try {
      console.log(`🌐 Processando logo: ${logoUrl}`);
      
      if (logoUrl.includes('cam.replayzone.com.br')) {
        const filename = path.basename(logoUrl);
        const localPath = path.join('/home/ftp/videos/logos', filename);
        
        if (fs.existsSync(localPath)) {
          console.log(`✅ Logo local encontrada: ${localPath}`);
          return localPath;
        } else {
          console.warn(`⚠️ Logo não encontrada localmente: ${localPath}`);
          return null;
        }
      }
      
      console.log(`📥 Fazendo download de logo externa: ${logoUrl}`);
      
      const agent = new https.Agent({  
        rejectUnauthorized: false
      });

      const response = await axios({
        method: 'GET',
        url: logoUrl,
        responseType: 'stream',
        httpsAgent: agent,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const extension = path.extname(logoUrl) || '.png';
      const tempPath = path.join(TEMP_DIR, `sponsor_${sponsorId}_${Date.now()}${extension}`);
      
      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Logo salva: ${tempPath}`);
          resolve(tempPath);
        });
        writer.on('error', (error) => {
          console.error('❌ Erro ao salvar logo:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Erro ao processar logo:', error);
      return null;
    }
  }

  async createSponsorBar(sponsors, width, perspectiva, semFaixaBranca = true) {
    try {
      const { createCanvas, loadImage } = require('canvas');
      
      // Definir altura baseada na perspectiva
      const height = perspectiva === 'vertical' ? Math.round(width * 0.15) : Math.round(width * 0.08);
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Fundo transparente (SEM faixa branca)
      ctx.clearRect(0, 0, width, height);

      if (sponsors.length === 0) {
        return this.saveTempCanvas(canvas, 'sponsor-bar');
      }

      // Calcular dimensões dos logos
      const logoHeight = Math.round(height * 0.8);
      const spacing = Math.round(width * 0.02);
      const totalLogosWidth = sponsors.reduce((total, sponsor, index) => {
        return total + logoHeight + (index > 0 ? spacing : 0);
      }, 0);

      // Centralizar horizontalmente
      let x = (width - totalLogosWidth) / 2;
      const y = (height - logoHeight) / 2;

      // Carregar e desenhar cada logo
      for (const sponsor of sponsors) {
        try {
          const img = await loadImage(sponsor.tempPath);
          
          // Manter aspect ratio
          const aspectRatio = img.width / img.height;
          const logoWidth = logoHeight * aspectRatio;
          
          // Desenhar logo com suavização
          ctx.drawImage(img, x, y, logoWidth, logoHeight);
          x += logoWidth + spacing;
        } catch (error) {
          console.error(`❌ Erro ao carregar logo ${sponsor.name}:`, error);
          x += logoHeight + spacing;
        }
      }

      return await this.saveTempCanvas(canvas, 'sponsor-bar');
    } catch (error) {
      console.error('❌ Erro ao criar barra de patrocinadores:', error);
      return null;
    }
  }

  saveTempCanvas(canvas, prefix) {
    return new Promise((resolve, reject) => {
      const tempDir = require('os').tmpdir();
      const filename = `${prefix}-${Date.now()}.png`;
      const filepath = require('path').join(tempDir, filename);
      
      const out = require('fs').createWriteStream(filepath);
      const stream = canvas.createPNGStream({
        compressionLevel: 9,
        filters: canvas.PNG_FILTER_NONE
      });
      
      stream.pipe(out);
      out.on('finish', () => {
        console.log(`✅ Canvas salvo: ${filepath}`);
        resolve(filepath);
      });
      out.on('error', reject);
    });
  }
}

module.exports = new SponsorService();