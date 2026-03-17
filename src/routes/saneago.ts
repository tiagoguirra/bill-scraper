import { FastifyInstance, FastifyReply } from 'fastify';
import fs from 'fs';
import os from 'os';
import { config } from '../config';
import { launchBrowser, login, navegarParaSegundaVia, listarFaturas, selecionarFatura, gerarEBaixar } from '../scrapers/saneago';

function sendPdf(reply: FastifyReply, destino: string) {
  const filename = destino.split(/[\\/]/).pop()!;
  const stream = fs.createReadStream(destino);
  reply.raw.on('finish', () => fs.unlink(destino, () => {}));
  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .send(stream);
}

export async function saneagoRoutes(app: FastifyInstance) {
  app.get('/saneago/list', async (_req, reply) => {
    const { browser, page } = await launchBrowser();
    try {
      await login(page, config.saneago.cpfCnpj, config.saneago.senha);
      await navegarParaSegundaVia(page);
      const faturas = await listarFaturas(page);
      return reply.send(faturas);
    } finally {
      await browser.close();
    }
  });

  app.get<{ Params: { numero: string } }>('/saneago/download/:numero', async (req, reply) => {
    const idx = parseInt(req.params.numero, 10) - 1;
    if (isNaN(idx) || idx < 0) {
      return reply.status(400).send({ error: 'Número de fatura inválido' });
    }

    const { browser, page } = await launchBrowser();
    try {
      await login(page, config.saneago.cpfCnpj, config.saneago.senha);
      await navegarParaSegundaVia(page);
      const faturas = await listarFaturas(page);

      if (idx >= faturas.length) {
        return reply.status(404).send({ error: `Fatura #${req.params.numero} não encontrada. Total: ${faturas.length}` });
      }

      await selecionarFatura(page, idx);
      const destino = await gerarEBaixar(page, os.tmpdir());
      return sendPdf(reply, destino);
    } finally {
      await browser.close();
    }
  });

  app.get('/saneago/download-all', async (_req, reply) => {
    const { browser, page } = await launchBrowser();
    try {
      await login(page, config.saneago.cpfCnpj, config.saneago.senha);
      await navegarParaSegundaVia(page);
      const faturas = await listarFaturas(page);

      if (faturas.length === 0) {
        return reply.status(404).send({ error: 'Nenhuma fatura encontrada' });
      }

      await page.locator('thead .p-checkbox-box').first().click();
      const destino = await gerarEBaixar(page, os.tmpdir());
      return sendPdf(reply, destino);
    } finally {
      await browser.close();
    }
  });
}
