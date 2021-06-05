import { Client } from 'discord.js';
import { log } from './log';

export const client = new Client({ disableMentions: 'none' });

client.on('ready', () => {
  log.info(`Logged into Discord as ${client.user?.tag}`);
});
