import { setup as setupAfkManager } from './afkManager';
import { setup as setupDeafenProtector } from './deafenProtector';
import { setup as setupBitrateEnforcer } from './bitrateEnforcer';
import { setup as setupChannelSync } from './channelSync';
import { setup as setupWeb } from './web';
import { setup as setupLedger } from './ledger';
import { setup as setupBotEnforcer } from './botEnforcer';

export const setup = async () => {
  setupAfkManager();
  setupDeafenProtector();
  setupBitrateEnforcer();
  setupChannelSync();
  await setupWeb();
  setupLedger();
  setupBotEnforcer();
};