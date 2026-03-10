const os = require('os');
const si = require('systeminformation');

class ReportGenerator {
  async generateServerReport() {
    try {
      const [memory, disk, cpuLoad] = await Promise.all([
        si.mem(),
        si.fsSize(),
        si.currentLoad()
      ]);

      const uptime = os.uptime();
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);

      const totalMemMB = memory.total / 1024 / 1024;
      const usedMemMB = memory.used / 1024 / 1024;
      const ramUsagePercent = ((usedMemMB / totalMemMB) * 100).toFixed(2);

      const cpuPercent = cpuLoad && cpuLoad.currentload !== undefined 
        ? cpuLoad.currentload.toFixed(2) 
        : 'N/A';

      const diskUse = disk && disk.length > 0 && disk[0].use !== undefined 
        ? disk[0].use.toFixed(1) 
        : 'N/A';

      return `
📊 *Relatório Diário do Servidor*
🖥️ *Host:* ${os.hostname()}
🔥 *Uso da CPU:* ${cpuPercent}%
📈 *Uptime:* ${uptimeHours}h ${uptimeMinutes}min
💾 *Disco usado:* ${diskUse}%
🧠 *RAM usada:* ${ramUsagePercent}%

🕒 Enviado em: ${new Date().toLocaleString('pt-BR')}
      `;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return '❌ Erro ao gerar relatório do servidor.';
    }
  }

  async generateStatusReport() {
    try {
      const [memory, disk, cpuLoad] = await Promise.all([
        si.mem(),
        si.fsSize(),
        si.currentLoad()
      ]);

      const uptime = os.uptime();
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);

      const totalMemMB = memory.total / 1024 / 1024;
      const usedMemMB = memory.used / 1024 / 1024;
      const ramUsagePercent = ((usedMemMB / totalMemMB) * 100).toFixed(2);

      const cpuPercent = cpuLoad && cpuLoad.currentload !== undefined 
        ? cpuLoad.currentload.toFixed(2) 
        : 'N/A';

      return `
📊 *Status Atual do Servidor*
🖥️ *Host:* ${os.hostname()}
🔥 *Uso da CPU:* ${cpuPercent}%
📈 *Uptime:* ${uptimeHours}h ${uptimeMinutes}min
💾 *Disco usado:* ${disk[0].use.toFixed(1)}%
🧠 *RAM usada:* ${ramUsagePercent}%

🕒 Consultado em: ${new Date().toLocaleString('pt-BR')}
      `;
    } catch (error) {
      console.error('Erro ao gerar status:', error);
      return '❌ Erro ao gerar status do servidor.';
    }
  }
}

module.exports = new ReportGenerator();