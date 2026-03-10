const axios = require('axios');
const https = require('https');
const chatManager = require('../utils/chatManager');
const { TELEGRAM_TOKENS, MESSAGE_TEMPLATES } = require('../config/constants');

class ErrorNotifier {
  constructor() {
    this.agent = new https.Agent({ family: 4 });
    this.token = TELEGRAM_TOKENS.ERROR;
  }

  async sendNotification(cameraId, tipo, origem = 'DESCONHECIDO', errorData = null) {
    try {
      const chatIds = chatManager.getChatIds();
      
      if (!Array.isArray(chatIds) || chatIds.length === 0) {
        console.warn('Nenhum chat_id válido encontrado');
        return;
      }

      let message = '';
      
      switch (tipo) {
        case 1:
          // Formato antigo para compatibilidade
          message = this.formatErrorMessage(tipo, cameraId, origem, errorData);
          break;
        case 2:
          message = MESSAGE_TEMPLATES.CONNECTION
            .replace(/{cameraId}/g, cameraId)
            .replace(/{arduinoName}/g, origem);
          break;
        case 3:
          message = MESSAGE_TEMPLATES.DISCONNECTION
            .replace(/{cameraId}/g, cameraId)
            .replace(/{arduinoName}/g, origem);
          break;
        case 4:
          // NOVO: Tipo para erros com detalhes
          message = this.formatDetailedErrorMessage(cameraId, origem, errorData);
          break;
        default:
          console.error('Tipo de notificação inválido:', tipo);
          return;
      }

      for (const chatId of chatIds) {
        try {
          await axios.post(
            `https://api.telegram.org/bot${this.token}/sendMessage`,
            {
              chat_id: chatId,
              text: message,
              parse_mode: 'Markdown'
            },
            { httpsAgent: this.agent }
          );
          console.log(`Mensagem de erro enviada para chat_id ${chatId}`);
        } catch (sendErr) {
          console.error(`Erro ao enviar para chat_id ${chatId}:`, sendErr.response?.data || sendErr.message);
        }
      }

      console.log('✅ Todas as mensagens de erro foram processadas.');
    } catch (err) {
      console.error('Erro geral ao enviar mensagens de erro:', err.message);
    }
  }

  formatErrorMessage(tipo, cameraId, origem, errorData) {
    // Para compatibilidade com código antigo
    return MESSAGE_TEMPLATES.ERROR.replace(/{cameraId}/g, cameraId);
  }

  formatDetailedErrorMessage(cameraId, origem, errorData) {
    const timestamp = new Date().toLocaleString('pt-BR');
    
    // Extrair informações do erro
    let errorDetails = '';
    let errorMessage = '';
    let stackTrace = '';
    
    if (errorData) {
      // Se errorData for um objeto de erro
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
      
      // Extrair stack trace se disponível
      if (errorData.stack) {
        stackTrace = errorData.stack.split('\n').slice(0, 3).join('\n');
      }
      
      // Formatar detalhes adicionais
      if (errorData.context) errorDetails += `\n📋 **Contexto:** ${errorData.context}`;
      if (errorData.stage) errorDetails += `\n🎯 **Etapa:** ${errorData.stage}`;
      if (errorData.cameraId) errorDetails += `\n📹 **Câmera:** ${errorData.cameraId}`;
      if (errorData.code) errorDetails += `\n🔢 **Código:** ${errorData.code}`;
      if (errorData.errno) errorDetails += `\n🔢 **Errno:** ${errorData.errno}`;
      if (errorData.path) errorDetails += `\n📁 **Caminho:** ${errorData.path}`;
      if (errorData.duration) errorDetails += `\n⏱️ **Duração:** ${errorData.duration}`;
      if (errorData.videoName) errorDetails += `\n🎬 **Vídeo:** ${errorData.videoName}`;
    }

    // Mensagem formatada para Telegram
    return `
🚨 *ERRO NO PROCESSAMENTO DE REPLAY*

📡 **Origem:** ${origem}
📹 **Câmera ID:** ${cameraId}
⏰ **Horário:** ${timestamp}

❌ **Erro:** ${errorMessage || 'Erro não especificado'}

${errorDetails}

${stackTrace ? `🔍 **Stack Trace:**\n\`\`\`\n${stackTrace}\n\`\`\`` : ''}

⚡ **Ação necessária:**
1. Verificar se a câmera ${cameraId} está online
2. Confirmar que o diretório /home/Shinobi/videos/1/${cameraId} existe
3. Verificar permissões do diretório
4. Reiniciar Shinobi se necessário

📊 **Status atual:** Processamento interrompido

🔧 _Equipe técnica, atenção urgente!_
`;
  }
}

module.exports = new ErrorNotifier();