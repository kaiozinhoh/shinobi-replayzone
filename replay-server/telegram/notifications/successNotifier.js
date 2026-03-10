const axios = require('axios');
const https = require('https');
const chatManager = require('../utils/chatManager');
const { TELEGRAM_TOKENS, MESSAGE_TEMPLATES } = require('../config/constants');

class SuccessNotifier {
  constructor() {
    this.agent = new https.Agent({ family: 4 });
    this.token = TELEGRAM_TOKENS.SUCCESS;
  }

  async sendNotification(cameraId) {
    try {
      const chatIds = chatManager.getChatIds();
      
      if (!Array.isArray(chatIds) || chatIds.length === 0) {
        console.warn('Nenhum chat_id válido encontrado');
        return;
      }

      const message = MESSAGE_TEMPLATES.SUCCESS.replace(/{cameraId}/g, cameraId);

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
          console.log(`Mensagem de sucesso enviada para chat_id ${chatId}`);
        } catch (sendErr) {
          console.error(`Erro ao enviar para chat_id ${chatId}:`, sendErr.response?.data || sendErr.message);
        }
      }

      console.log('✅ Todas as mensagens de sucesso foram processadas.');
    } catch (err) {
      console.error('Erro geral ao enviar mensagens de sucesso:', err.message);
    }
  }
}

module.exports = new SuccessNotifier();