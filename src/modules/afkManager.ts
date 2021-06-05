import { log as parentLog } from '../log';
import { enabledConfigName, getConfigItem } from '../global/configuration';
import { client } from '../discord';

const log = parentLog.getChildLogger({ name: 'AFK Manager' });

const moduleSlug = 'afk-manager';

type AfkInfo = {
  lastChannel?: string;
  timeout?: NodeJS.Timeout;
};

const userAfkInfo: { [userId: string]: AfkInfo | undefined } = {};

const processMember = async (userId: string, guildId: string) => {
  log.debug('Processing tick for user', { userId });
  const guild = client.guilds.resolve(guildId);
  const member = guild?.members.resolve(userId);
  if (!member) return;
  if (!member.voice.channel || !member.voice.channel.parent) return;

  userAfkInfo[member.id] = {
    ...(userAfkInfo[member.id] || {}),
    timeout: undefined,
  };

  const categoryChannels = member.voice.channel.parent.children.sort(
    (a, b) => a.position - b.position
  );
  const categoryVoiceChannels = categoryChannels.filter(
    (chan) => chan.type === 'voice'
  );
  const afkChannelId = categoryVoiceChannels.last()?.id;
  if (!afkChannelId) return;

  // If selfDeaf === are we in the afk channel?
  const inAfkChannel = member.voice.channel.id === afkChannelId;
  if (member.voice.selfDeaf === inAfkChannel) return;

  if (member.user.bot) return;
  if (member.voice.streaming) return;
  if (member.voice.selfVideo) return;

  if (member.voice.selfDeaf) {
    userAfkInfo[member.id]!.lastChannel = member.voice.channel.id;

    log.debug('Moved user to AFK channel', {
      userId,
      guildId,
      afkChannelId,
    });

    member.voice.setChannel(afkChannelId, 'AFK Manager moving to AFK');
  } else {
    if (!userAfkInfo[member.id]!.lastChannel) return;

    log.debug('Moved user to previous channel', {
      userId,
      guildId,
      lastChannelId: userAfkInfo[member.id]!.lastChannel,
    });

    member.voice.setChannel(
      userAfkInfo[member.id]!.lastChannel!,
      'AFK Manager moving to previous channel'
    );

    delete userAfkInfo[member.id];
  }
};

export const setup = () => {
  log.info('Initializing AFK Manager');

  client.on('voiceStateUpdate', (_, newState) => {
    const guildEnabled =
      getConfigItem(
        enabledConfigName({ moduleSlug, guildId: newState.guild.id }),
        'false'
      ) === 'true';
    if (!guildEnabled) return;

    if (!newState.member) return;
    const userId = newState.member.user.id;
    const guildId = newState.guild.id;

    const userEnabled =
      getConfigItem(
        enabledConfigName({ moduleSlug, userId: userId }),
        'true'
      ) === 'true';
    if (!userEnabled) return;

    if (userAfkInfo[userId]?.timeout) {
      client.clearTimeout(userAfkInfo[userId]!.timeout!);
      userAfkInfo[userId]!.timeout = undefined;
    }

    const timeoutLength = newState.selfDeaf ? 1000 * 30 : 0;

    log.debug('Set timeout', { userId, guildId, timeoutLength });

    const timeout = client.setTimeout(() => {
      processMember(userId, guildId);
    }, timeoutLength);

    userAfkInfo[newState.member.id] = {
      ...(userAfkInfo[newState.member.id] || {}),
      timeout,
    };
  });
};
