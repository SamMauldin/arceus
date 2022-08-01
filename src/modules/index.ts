import { setup as setupAfkManager } from './afkManager';
import { setup as setupDeafenProtector } from './deafenProtector';
import { setup as setupBitrateEnforcer } from './bitrateEnforcer';
import { setup as setupChannelSync } from './channelSync';
import { setup as setupWeb } from './web';
import { setup as setupLedger } from './ledger';
import { setup as setupBotEnforcer } from './botEnforcer';
import { setup as setupCasino } from './casino';
import { setup as setupGoldDistributor } from './goldDistributor';
import { setup as setupJarvis } from './jarvis';

export const setup = async () => {
  setupAfkManager();
  setupDeafenProtector();
  setupBitrateEnforcer();
  setupChannelSync();
  await setupWeb();
  setupLedger();
  setupBotEnforcer();
  setupCasino();
  setupGoldDistributor();
  setupJarvis();
};
