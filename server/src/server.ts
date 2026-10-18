/**
 * Server Entrypoint - Thin runner delegating to bootstrap
 */
import { bootstrap } from './bootstrap.js';

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
