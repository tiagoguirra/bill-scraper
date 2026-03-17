import { FastifyInstance } from 'fastify';
import fs from 'fs';
import { config } from '../config';
import { launchBrowser, login, listarFaturas } from '../scrapers/equatorial';

export async function equatorialRoutes(app: FastifyInstance) {
  app.get('/equatorial/list', async (_req, reply) => {
    if (!config.EQUATORIAL_UC || !config.EQUATORIAL_DATA_NASCIMENTO) {
      return reply.status(500).send({ error: 'EQUATORIAL_UC e EQUATORIAL_DATA_NASCIMENTO não configurados' });
    }

    const { browser, page } = await launchBrowser();
    try {
      await login(page, config.EQUATORIAL_UC, config.CPF_CNPJ, config.EQUATORIAL_DATA_NASCIMENTO);
      const destino = await listarFaturas(page, config.EQUATORIAL_UC, config.DOWNLOAD_DIR);

      const stream = fs.createReadStream(destino);
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${destino.split(/[\\/]/).pop()}"`)
        .send(stream);
    } finally {
      await browser.close();
    }
  });
}
