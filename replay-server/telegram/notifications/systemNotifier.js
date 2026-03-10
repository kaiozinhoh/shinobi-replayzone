const TelegramBot = require('node-telegram-bot-api');
const chatManager = require('../utils/chatManager');
const reportGenerator = require('../utils/reportGenerator');
const { TELEGRAM_TOKENS } = require('../config/constants');

class SystemNotifier {
  constructor() {
    this.bot = new TelegramBot(TELEGRAM_TOKENS.ERROR, {
      polling: true,
      request: { family: 4 }
    });
    this.waitingForResponse = new Set();
    this.setupHandlers();
  }

  setupHandlers() {
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/sair/, this.handleExit.bind(this));
    this.bot.onText(/\/status/, this.handleStatus.bind(this));
    this.bot.on('message', this.handleMessage.bind(this));
  }

  async handleStart(msg) {
    const chatId = msg.chat.id;
    
    if (chatManager.hasChatId(chatId)) {
      this.bot.sendMessage(
        chatId,
        '🟢 Tudo certo com o sistema!\nVocê já está na lista de alertas.\nSe quiser sair, digite /sair.\nPara ver o status do servidor, digite /status.'
      );
    } else {
      this.bot.sendMessage(
        chatId,
        'Olá! Você deseja receber alertas automáticos de erro no sistema?\nResponda com *sim* ou *não*.',
        { parse_mode: 'Markdown' }
      );
      this.waitingForResponse.add(chatId);
    }
  }

  async handleExit(msg) {
    const chatId = msg.chat.id;
    
    if (chatManager.hasChatId(chatId)) {
      chatManager.removeChatId(chatId);
      this.bot.sendMessage(chatId, '✅ Você foi removido da lista de alertas.');
    } else {
      this.bot.sendMessage(chatId, 'Você não está na lista de alertas.');
    }
    this.waitingForResponse.delete(chatId);
  }

  async handleStatus(msg) {
    const chatId = msg.chat.id;
    
    if (!chatManager.hasChatId(chatId)) {
      this.bot.sendMessage(
        chatId,
        '❌ Você precisa estar na lista de alertas para usar este comando.\nEnvie /start para entrar na lista.'
      );
      return;
    }

    try {
      const report = await reportGenerator.generateStatusReport();
      this.bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
    } catch (error) {
      this.bot.sendMessage(chatId, '❌ Erro ao gerar o status do servidor.');
      console.error('Erro no comando /status:', error);
    }
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text?.toLowerCase();

    if (!text || text.startsWith('/')) return;

    if (this.waitingForResponse.has(chatId)) {
      if (text === 'sim') {
        chatManager.addChatId(chatId);
        this.bot.sendMessage(chatId, '✅ Você foi adicionado à lista de alertas.');
        this.waitingForResponse.delete(chatId);
      } else if (text === 'não' || text === 'nao') {
        this.bot.sendMessage(chatId, 'Tudo bem! Você não foi adicionado à lista.');
        this.waitingForResponse.delete(chatId);
      } else {
        this.bot.sendMessage(chatId, '❗ Por favor, responda apenas com *sim* ou *não*.', { parse_mode: 'Markdown' });
      }
    } else if (chatManager.hasChatId(chatId)) {
      this.bot.sendMessage(
        chatId,
        '🟢 Tudo certo com o sistema!\nVocê já está na lista de alertas. Se quiser sair, digite /sair.\nPara ver o status do servidor, digite /status.'
      );
    } else {
      this.bot.sendMessage(
        chatId,
        '👋 Olá! Para começar a receber alertas automáticos, envie o comando /start.'
      );
    }
  }
}

module.exports = SystemNotifier;