import { config } from 'dotenv';
config();

import { log } from './log';
import { prisma } from './prisma';
import { client } from './discord';
import { registerHandler as registerCommandHandler } from './global/commandRegistry';
import { registerCommands } from './commands/index';
import { loadConfiguration } from './global/configuration';
import { setup as setupModules } from './modules';

const main = async () => {
  log.info('Connecting to database');
  await prisma.$connect();
  log.info('Connected to database!');

  log.info('Loading Configuration');
  await loadConfiguration();

  log.info('Loading Arceus Modules');

  registerCommandHandler();
  registerCommands();

  await setupModules();

  log.info('Connecting to Discord');
  await client.login(process.env.DISCORD_TOKEN);
  log.info('Connected to Discord!');
};

main().catch((e) => {
  log.error('Error during initialization!');
  log.error(e);
  process.exit(1);
});
