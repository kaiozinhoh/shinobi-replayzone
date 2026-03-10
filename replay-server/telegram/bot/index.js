const SystemNotifier = require('../notifications/systemNotifier');
const ServerMonitor = require('../monitor/serverMonitor');

class TelegramBot {
  constructor() {
    this.systemNotifier = new SystemNotifier();
    this.serverMonitor = new ServerMonitor();
    
    console.log('Bot Telegram inicializado com sucesso');
  }
}

module.exports = TelegramBot;