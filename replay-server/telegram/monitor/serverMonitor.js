const cron = require('node-cron');
const chatManager = require('../utils/chatManager');
const reportGenerator = require('../utils/reportGenerator');
const errorNotifier = require('../notifications/errorNotifier');

class ServerMonitor {
  constructor() {
    this.setupCronJobs();
  }

  async sendReportToTelegram() {
    const chatIds = chatManager.getChatIds();
    if (chatIds.length === 0) {
      console.log('Nenhum chatId para enviar relatório.');
      return;
    }

    try {
      const report = await reportGenerator.generateServerReport();
      
      for (const chatId of chatIds) {
        try {
          await errorNotifier.bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
          console.log(`Relatório enviado para ${chatId}`);
        } catch (e) {
          console.error(`Erro ao enviar relatório para ${chatId}:`, e.response?.data || e.message);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
    }
  }

  setupCronJobs() {
    // Agenda envio diário às 08:00
    cron.schedule('0 8 * * *', () => {
      console.log('⏰ Enviando relatório diário às 8h...');
      this.sendReportToTelegram();
    });

    // Agenda envio diário às 22:00
    cron.schedule('0 22 * * *', () => {
      console.log('⏰ Enviando relatório diário às 22h...');
      this.sendReportToTelegram();
    });

    console.log('Monitoramento do servidor iniciado');
  }
}

module.exports = ServerMonitor;