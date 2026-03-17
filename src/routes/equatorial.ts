import { FastifyInstance } from 'fastify';
import fs from 'fs';
import { config } from '../config';
import { launchBrowser, login, listarFaturas } from '../scrapers/equatorial';

export async function equatorialRoutes(app: FastifyInstance) {
  app.get('/equatorial/list', async (_req, reply) => {
    const { uc, cpf, dataNascimento } = config.equatorial;
    if (!uc || !cpf || !dataNascimento) {
      return reply.status(500).send({ error: 'EQUATORIAL_UC, EQUATORIAL_CPF e EQUATORIAL_DATA_NASCIMENTO não configurados' });
    }

    const { browser, page } = await launchBrowser();
    try {
      await login(page, uc, cpf, dataNascimento);
      const destino = await listarFaturas(page, uc, config.DOWNLOAD_DIR);

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
