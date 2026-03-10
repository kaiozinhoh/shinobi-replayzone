const fs = require('fs');
const path = require('path');
const { CHAT_IDS_PATH } = require('../config/constants');

class ChatManager {
  constructor() {
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    const dirPath = path.dirname(CHAT_IDS_PATH);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(CHAT_IDS_PATH)) {
      this.saveChatIds([]);
    }
  }

  getChatIds() {
    try {
      const rawData = fs.readFileSync(CHAT_IDS_PATH, 'utf-8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error('Erro ao ler chat IDs:', error);
      return [];
    }
  }

  saveChatIds(chatIds) {
    try {
      fs.writeFileSync(CHAT_IDS_PATH, JSON.stringify(chatIds, null, 2));
      return true;
    } catch (error) {
      console.error('Erro ao salvar chat IDs:', error);
      return false;
    }
  }

  addChatId(chatId) {
    const chatIds = this.getChatIds();
    if (!chatIds.includes(chatId)) {
      chatIds.push(chatId);
      return this.saveChatIds(chatIds);
    }
    return true;
  }

  removeChatId(chatId) {
    const chatIds = this.getChatIds();
    const filteredChatIds = chatIds.filter(id => id !== chatId);
    return this.saveChatIds(filteredChatIds);
  }

  hasChatId(chatId) {
    const chatIds = this.getChatIds();
    return chatIds.includes(chatId);
  }
}

module.exports = new ChatManager();