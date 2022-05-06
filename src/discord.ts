import { Client } from 'discord.js';
import { log } from './log';

export const client = new Client({
  intents: [
    'GUILDS',
    'GUILD_MEMBERS',
    'GUILD_BANS',
    'GUILD_EMOJIS_AND_STICKERS',
    'GUILD_INTEGRATIONS',
    'GUILD_WEBHOOKS',
    'GUILD_INVITES',
    'GUILD_VOICE_STATES',
    'GUILD_PRESENCES',
    'GUILD_MESSAGES',
    'GUILD_MESSAGE_REACTIONS',
    'GUILD_MESSAGE_TYPING',
    'DIRECT_MESSAGES',
    'DIRECT_MESSAGE_REACTIONS',
    'DIRECT_MESSAGE_TYPING',
    'GUILD_SCHEDULED_EVENTS',
  ],
  allowedMentions: { parse: [] },
});

client.on('ready', () => {
  log.info(`Logged into Discord as ${client.user?.tag}`);
});
