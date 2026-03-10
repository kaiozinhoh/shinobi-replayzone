const path = require('path');
require('dotenv').config();

module.exports = {
  TELEGRAM_TOKENS: {
    ERROR: process.env.TELEGRAM_ERROR_TOKEN || '7952969691:AAEJsQhzLuX6o6yYbz9lwkCbHvj5VNFrBNU',
    SUCCESS: process.env.TELEGRAM_SUCCESS_TOKEN || '8043330772:AAF0Rdzx0mjXnpvaDo_yeCoiYu1N7EG5QXA'
  },
  CHAT_IDS_PATH: path.join(__dirname, '..', 'data', 'chatids.json'),
  MESSAGE_TEMPLATES: {
    ERROR: `
🚨 *ALERTA DE ERRO NO REPLAY* 🚨

⚠️ Ocorreu um erro ao salvar o replay da câmera: *{cameraId}*

🕒 Por favor, verifique o sistema para evitar perda de dados.

📌 *Detalhes:*  
- Câmera: *{cameraId}*  
- Ação necessária: Revisar logs e reiniciar o processo, se necessário.

🔧 _Equipe técnica, atenção!_

⚙️ *Possíveis soluções físicas:*  
- Cabo ou fio rompido na quadra  
- Câmera desligada  

🖥️ *Possíveis soluções lógicas:*  
- Shinobi travado ou MediaMTX parado  
- Armazenamento cheio
    `,
    SUCCESS: `
✅ *REPLAY SALVO COM SUCESSO* ✅

📹 A gravação da câmera *{cameraId}* foi concluída e salva corretamente.

🕒 O sistema registrou o replay sem falhas e está operando normalmente.

📌 *Detalhes:*  
- Câmera: *{cameraId}*
- Status: Replay armazenado com êxito

🎉 Ótimo trabalho, tudo funcionando como esperado!

🛠️ _Monitoramento contínuo garantido._

📂 *Verifique no painel para acessar o vídeo salvo.*
    `,
    CONNECTION: `
📡 *BOTÃO DA QUADRA: {cameraId} Conectou ao Wi-Fi*

✅ O dispositivo *{arduinoName}* conectou-se com sucesso.

🔌 Câmera ID: *{cameraId}*
    `,
    DISCONNECTION: `
⚠️ *ESP8266 Desconectado do Wi-Fi*

❌ O dispositivo *{arduinoName}* perdeu a conexão com a rede.

🔌 Câmera ID: *{cameraId}*
    `
  }
};