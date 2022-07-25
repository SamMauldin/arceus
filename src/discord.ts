import { Client } from 'discord.js';
import { log } from './log';

export const client = new Client({
  intents: [32767],
  allowedMentions: { parse: [] },
});

client.on('ready', () => {
  log.info(`Logged into Discord as ${client.user?.tag}`);
});
