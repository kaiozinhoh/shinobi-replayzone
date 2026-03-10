const errorNotifier = require('../telegram/notifications/errorNotifier');

class NotificationController {
  async notifyArduino(req, res) {
    try {
      const { cameraId, tipo, arduinoName } = req.query;

      if (!cameraId || !tipo) {
        return res.status(400).json({ success: false, message: 'cameraId e tipo são obrigatórios' });
      }

      const tipoInt = parseInt(tipo);
      if (![1, 2, 3].includes(tipoInt)) {
        return res.status(400).json({ success: false, message: 'Tipo inválido. Use 1 (erro replay), 2 (conectado), 3 (desconectado)' });
      }
      errorNotifier.sendNotification(cameraId, tipoInt, arduinoName);

      return res.status(200).json({ success: true, message: 'Notificação enviada com sucesso' });
    } catch (err) {
      console.error('Erro no /notify-arduino:', err);
      return res.status(500).json({ success: false, message: 'Erro ao enviar notificação' });
    }
  }
}

module.exports = new NotificationController();