const pool = require('../config/database');

class DatabaseService {
  async getSponsorsByQuadraId(quadraId) {
    try {
      console.log(`Buscando patrocinadores para quadra: ${quadraId}`);
      
      const [results] = await pool.execute(
        'SELECT name, logo_url, position FROM sponsors WHERE quadra_id = ? ORDER BY created_at',
        [quadraId]
      );
      
      console.log(`Encontrados ${results.length} patrocinadores`);
      return results;
    } catch (error) {
      console.error('Erro ao buscar patrocinadores:', error);
      return [];
    }
  }

  async getSubquadraByCameraId(cameraId) {
  try {
    console.log(`Buscando informações da subquadra para cameraId: ${cameraId}`);
    
    const [results] = await pool.execute(
      `SELECT id, quadra_id, nome, tipo, camera_link, cameraId, link_pronto, ativo
       FROM subquadras 
       WHERE cameraId = ?`,
      [cameraId]
    );
    
    if (results.length > 0) {
      const subquadra = results[0];
      console.log(`Subquadra encontrada: ${JSON.stringify(subquadra)}`);
      return subquadra;
    } else {
      console.log(`Nenhuma subquadra encontrada para cameraId: ${cameraId}`);
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar subquadra por cameraId:', error);
    return null;
  }
}

  async getQuadraIdFromSubquadra(subquadraId) {
    try {
      console.log(`Buscando quadra_id para a subquadraId: ${subquadraId}`);
      
      const [results] = await pool.execute('SELECT quadra_id FROM subquadras WHERE id = ?', [subquadraId]);
      
      if (results.length > 0) {
        const quadraId = results[0].quadra_id;
        console.log(`Quadra_id encontrado: ${quadraId}`);
        return quadraId;
      } else {
        throw new Error(`Nenhuma quadra encontrada para o subquadraId: ${subquadraId}`);
      }
    } catch (error) {
      console.error('Erro ao buscar quadra_id:', error);
      throw error;
    }
  }

  async getSubquadraData(subquadraId) {
    try {
      console.log(`Buscando dados completos da subquadra: ${subquadraId}`);
      
      const [results] = await pool.execute('SELECT * FROM subquadras WHERE id = ?', [subquadraId]);
      
      if (results.length > 0) {
        const subquadra = results[0];
        console.log(`Dados da subquadra encontrados:`, subquadra);
        return subquadra;
      } else {
        throw new Error(`Subquadra não encontrada: ${subquadraId}`);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da subquadra:', error);
      throw error;
    }
  }

    async getQuadraPerspective(quadraId) {
      try {
        const query = 'SELECT perspectiva FROM quadras WHERE id = ?';
        const [rows] = await pool.execute(query, [quadraId]);
        return rows[0] || { perspectiva: 'horizontal' };
      } catch (error) {
        console.error('Erro ao buscar perspectiva da quadra:', error);
        return { perspectiva: 'horizontal' }; // padrão
      }
    }

  async saveVideoToDatabase(subquadraId, position, videoUrl, tipo, quadraId) {
    try {
      console.log(`Iniciando inserção no banco de dados para o vídeo ${videoUrl}`);
      
      const [results] = await pool.execute(
        'INSERT INTO videos_subquadra (subquadra_id, caminho_video, id_camera, tipo, id_quadra_videos) VALUES (?, ?, ?, ?, ?)',
        [subquadraId, videoUrl, position, tipo, quadraId]
      );
      
      console.log('Vídeo registrado no banco de dados:', results);
      return results;
    } catch (error) {
      console.error('Erro ao inserir vídeo no banco de dados:', error);
      throw error;
    }
  }
 async saveVideoToDatabase(subquadraId, position, videoUrl, tipo, quadraId, groupCode = null) {
    try {
      console.log(`Iniciando inserção no banco de dados para o vídeo ${videoUrl}`);
      console.log(`Group Code: ${groupCode}, Position: ${position}`);
      
      const [results] = await pool.execute(
        'INSERT INTO videos_subquadra (subquadra_id, caminho_video, id_camera, tipo, id_quadra_videos, group_code) VALUES (?, ?, ?, ?, ?, ?)',
        [subquadraId, videoUrl, position, tipo, quadraId, groupCode]
      );
      
      console.log('Vídeo registrado no banco de dados:', results);
      return results;
    } catch (error) {
      console.error('Erro ao inserir vídeo no banco de dados:', error);
      throw error;
    }
  }

  // Método para buscar vídeos agrupados
  async getGroupedVideos(subquadraId, date, hour) {
    try {
      const query = `
        SELECT 
          vs.*,
          CASE 
            WHEN vs.group_code IS NOT NULL THEN 
              (SELECT COUNT(*) FROM videos_subquadra vs2 
               WHERE vs2.group_code = vs.group_code AND vs2.subquadra_id = vs.subquadra_id)
            ELSE 1
          END as video_count,
          vs.group_code
        FROM videos_subquadra vs
        WHERE vs.subquadra_id = ? 
          AND DATE(vs.criado_em) = ?
          AND HOUR(vs.criado_em) = ?
        ORDER BY 
          CASE 
            WHEN vs.group_code IS NOT NULL THEN vs.group_code 
            ELSE vs.id 
          END,
          vs.id_camera
      `;
      
      const [results] = await pool.execute(query, [subquadraId, date, hour]);
      return this.groupVideos(results);
    } catch (error) {
      console.error('Erro ao buscar vídeos agrupados:', error);
      throw error;
    }
  }

  // Agrupar vídeos pelo group_code
  groupVideos(videos) {
    const grouped = {};
    
    videos.forEach(video => {
      const key = video.group_code || `single_${video.id}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          groupCode: video.group_code,
          videos: [],
          videoCount: video.video_count,
          createdAt: video.criado_em
        };
      }
      
      grouped[key].videos.push(video);
    });
    
    return Object.values(grouped);
  }
}

module.exports = new DatabaseService();