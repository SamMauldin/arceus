import { VoiceChannel } from 'discord.js';
import { client } from '../discord';
import { enabledConfigName, getConfigItem } from '../global/configuration';

const BIRATE_SET_INTERVAL = 1000 * 3;

const moduleSlug = 'bitrate-enforcer';

export const setup = () => {
  client.setInterval(() => {
    client.guilds.cache.forEach((guild) => {
      const guildEnabled =
        getConfigItem(
          enabledConfigName({ moduleSlug, guildId: guild.id }),
          'false'
        ) === 'true';
      if (!guildEnabled) return;

      guild.channels.cache
        .filter((chan) => chan.type === 'voice')
        .forEach((chan) => {
          const channel = chan as VoiceChannel;

          const channelEnabled =
            getConfigItem(
              enabledConfigName({ moduleSlug, channelId: chan.id }),
              'true'
            ) === 'true';
          if (!channelEnabled) return;

          if (!channel.editable) return;
          if (channel.bitrate >= 64000) return;

          channel
            .setBitrate(64000, 'Bitrate Enforcer detected low bitrate')
            .catch(() => {});
        });
    });
  }, BIRATE_SET_INTERVAL);
};
