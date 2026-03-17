import Fastify from 'fastify';
import { config } from './config';
import { saneagoRoutes } from './routes/saneago';
import { equatorialRoutes } from './routes/equatorial';

const app = Fastify({ logger: true });

app.register(saneagoRoutes);
app.register(equatorialRoutes);

app.listen({ port: config.PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
