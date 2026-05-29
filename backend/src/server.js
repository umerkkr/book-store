import app from './app.js';
import { config } from './config.js';
import { initDb } from './initDb.js';

async function start() {
  await initDb();
  app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
